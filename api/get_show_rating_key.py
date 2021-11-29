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

# get from dictionary with some safeguards
def safeget(dic: dict, key: str, default: Any = None):
  return dic[key] if key in dic else default

class handler(BaseHTTPRequestHandler):
  
  def do_POST(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    content_length = int(self.headers['Content-Length'])
    body = self.rfile.read(content_length)
    data = ShowPostRequestBodyDTO(json.loads(body.decode()))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.end_headers()
    response_body = get_show_rating_key(
      query["plex_token"],
      query["server_name"],
      request=data,
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
      

class ShowPostRequestBodyDTO:
  grandparentTitle = str() # Name of the show for the episode
  grandparentGuid = str() # Plex GUID for the show

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
        "grandparentTitle": {"type": "string"},
        "grandparentGuid": {"type": "string"},
      },
      "required": ["grandparentTitle", "grandparentGuid"]
    }  

# see: https://stackoverflow.com/a/8187203
class ShowGuidRatingKeyPairDTO:
  title = str() # Show title
  guid = str() # Used for globally identifying a show across Plex servers
  ratingKey = int() # Used for searching up episodes more quickly later
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def get_show_rating_key(plex_token: str, server_name: str, request: ShowPostRequestBodyDTO) -> ShowGuidRatingKeyPairDTO:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()  
    # plex's database is indexed for searching, so lets search with the title we have
    shows: list[Show] = plex.library.search(title=request.grandparentTitle, libtype='show')
    # iterate over the results for an identical guid
    for show in shows:
      # first show with a matching guid
      if show.guid == request.grandparentGuid:
        return ShowGuidRatingKeyPairDTO(
          title=show.title,
          guid=show.guid,
          ratingKey=show.ratingKey,
        )
    return []
  else:
    return []

if __name__ == "__main__":
  # print(str(jsonpickle.encode(get_tv_rating_keys(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars", request=ShowPostRequestBodyDTO({
  #   "grandparentTitle": "13 Reasons Why",
  #   "grandparentGuid": "plex://show/5d9c07fc0aaccd001f8ec1ba",
  # })), indent=2)))

  print(str(jsonpickle.encode(get_show_rating_key(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars", request=ShowPostRequestBodyDTO({
    "grandparentTitle": "Adventure Time",
    "grandparentGuid": "plex://show/5d9c07f72df347001e3a70b4",
  })), indent=2)))