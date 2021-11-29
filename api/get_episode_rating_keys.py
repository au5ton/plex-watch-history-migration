import os
import json
import jsonpickle
from jsonschema import validate
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.library import LibrarySection, ShowSection
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from plexapi.video import Episode, Show
from typing import Any

# get from dictionary with some safeguards
def safeget(dic: dict, key: str, default: Any = None):
  return dic[key] if key in dic else default

class handler(BaseHTTPRequestHandler):
  
  def do_POST(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    content_length = int(self.headers['Content-Length'])
    body = self.rfile.read(content_length)
    data = EpisodePostRequestBodyDTO(json.loads(body.decode()))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.end_headers()
    response_body = get_tv_rating_keys(
      query["plex_token"],
      query["server_name"],
      request=data,
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
      

class EpisodePostRequestBodyDTO:
  showRatingKey = int()
  showGuid = str() # Plex GUID for the show
  watchedEpisodes: list[str] = list() # List of episode GUIDs of which are watched episodes on the source server

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
        "showRatingKey": {"type": "integer"},
        "showGuid": {"type": "string"},
        "watchedEpisodes": {"type": "array", "items": {"type": "string"}},
      },
      "required": ["showRatingKey", "showGuid", "watchedEpisodes"]
    }  

# see: https://stackoverflow.com/a/8187203
class GuidRatingKeyPairDTO:
  guid = str() # Used for globally identifying an episode across Plex servers
  ratingKey = int() # Used for individual episode scrobbling
  forServer = str() # Name of server this ratingKey is associated with
  formatted = str() # Human representation of this episode
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def get_tv_rating_keys(plex_token: str, server_name: str, request: EpisodePostRequestBodyDTO) -> list[GuidRatingKeyPairDTO]:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()
    
    # get the show reference
    show: Show = plex.library.fetchItem(request.showRatingKey)
    if show.guid == request.showGuid:
      episodes: list[Episode] = show.episodes()
      return [
        GuidRatingKeyPairDTO(
          guid=item.guid,
          ratingKey=item.ratingKey,
          forServer=server_name,
          formatted=f'{item.grandparentTitle} - S{str(item.parentIndex).zfill(2)}E{str(item.index).zfill(2)}'
        )
        for item in episodes if item.guid in request.watchedEpisodes
      ]
    return []
  else:
    return []

if __name__ == "__main__":
  # print(str(jsonpickle.encode(get_tv_rating_keys(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars", request=EpisodePostRequestBodyDTO({
  #   "showRatingKey": 21987, # 13 Reasons Why
  #   "showGuid": "plex://show/5d9c07fc0aaccd001f8ec1ba",
  #   "watchedEpisodes": ["plex://episode/5d9c0bf93c3f87001f372728"]
  # })), indent=2)))

  print(str(jsonpickle.encode(get_tv_rating_keys(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars", request=EpisodePostRequestBodyDTO({
    "showRatingKey": 22002, # Adventure Time
    "showGuid": "plex://show/5d9c07f72df347001e3a70b4",
    "watchedEpisodes": ["plex://episode/5d9c0b7def619b002048b8a9","plex://episode/5d9c0b7d1cae62001f759094","plex://episode/5d9c0b7d2df347001e3cef0a"]
  })), indent=2)))