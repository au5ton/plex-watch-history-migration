import os
import json
import jsonpickle
from jsonschema import validate
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from plexapi.video import Show
from typing import Any
import concurrent.futures
import requests

# get from dictionary with some safeguards
def safeget(dic: dict, key: str, default: Any = None):
  return dic[key] if key in dic else default

class handler(BaseHTTPRequestHandler):
  
  def do_POST(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    content_length = int(self.headers['Content-Length'])
    body = self.rfile.read(content_length)
    data = ScrobblePostRequestBodyDTO(json.loads(body.decode()))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.end_headers()
    response_body = scrobble(
      query["plex_token"],
      query["server_jws"],
      request=data,
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
      

class ScrobblePostRequestBodyDTO:
  ratingKeys: list[int] = list() # List of rating keys to scrobble

  def __init__(self, data: dict):
    validate(instance=data, schema=self._schema())
    for key, value in data.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)
  def _schema(self) -> dict:
    return {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "properties": {
        "ratingKeys": {"type": "array", "items": {"type": "integer"}},
      },
      "required": ["ratingKeys"]
    }  

def verify_uri(server_jws: str) -> str:
  from jose import jws
  try:
    # if the given signature fails to jws.verify(), an exception is thrown
    # if the given signature successfully jws.verify()s, then the value returned must match the URI given
    return jws.verify(server_jws, os.environ["JWS_SECRET"], algorithms=['HS256']).decode()
  except:
    return ""

def scrobble(plex_token: str, server_jws: str, request: ScrobblePostRequestBodyDTO) -> list:
  if verify_uri(server_jws) != "":
    # connect to server directly
    plex = PlexServer(verify_uri(server_jws), plex_token)

    # generate list of scrobble URLs  
    urls = [f'{plex._baseurl}/:/scrobble?key={ratingKey}&identifier=com.plexapp.plugins.library&X-Plex-Token={plex_token}' for ratingKey in request.ratingKeys]
    out = []

    def do_scrobble(url):
      ans = requests.get(url, timeout=2)
      return ans.status_code

    # see: https://stackoverflow.com/a/46144596
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
      future_to_url = (executor.submit(do_scrobble, url) for url in urls)
      for future in concurrent.futures.as_completed(future_to_url):
        try:
          data = future.result()
        except Exception as exc:
          data = str(type(exc))
        finally:
          out.append(data)
    
    return out
  else:
    return []

if __name__ == "__main__":
  print(str(jsonpickle.encode(scrobble(plex_token=os.environ["X_PLEX_TOKEN"], server_jws="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.FOO.BAR", request=ScrobblePostRequestBodyDTO({
    "ratingKeys": [2150, 2151, 2152],
  })), indent=2)))