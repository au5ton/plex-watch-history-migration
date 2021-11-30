import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.myplex import MyPlexAccount, MyPlexResource
from plexapi.server import PlexServer
from jose import jws

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.end_headers()
    response_body = list_servers(query["plex_token"])
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
    return

class PlexServerDTO:
  name = str()
  server_uri_jws = str()
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def verify_uri(server_jws: str) -> str:
  from jose import jws
  try:
    # if the given signature fails to jws.verify(), an exception is thrown
    # if the given signature successfully jws.verify()s, then the value returned must match the URI given
    return jws.verify(server_jws, os.environ["JWS_SECRET"], algorithms=['HS256']).decode()
  except:
    return ""

def list_servers(plex_token: str) -> list[PlexServerDTO]:
  account = MyPlexAccount(token=plex_token)
  servers: list[MyPlexResource] = [item for item in account.resources() if item.product == 'Plex Media Server']
  results: list[PlexServerDTO] = []

  for server in servers:
    # connect to the server to verify it works
    try:
      plex: PlexServer = server.connect(timeout=0.5)
      uri_jws = jws.sign(plex._baseurl.encode(), os.environ["JWS_SECRET"], algorithm='HS256')
      results.append(PlexServerDTO(
        name=server.name,
        server_uri_jws=uri_jws
        ))
    except:
      pass
  return results

if __name__ == "__main__":
  print(str(jsonpickle.encode(list_servers(plex_token=os.environ["X_PLEX_TOKEN"]), indent=2)))