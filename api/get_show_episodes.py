import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.library import ShowSection
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from plexapi.video import Episode, Show
from typing import Any

import requests

# get from dictionary with some safeguards
def safeget(dic: dict, key: str, default: Any = None):
  return dic[key] if key in dic else default

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.end_headers()
    response_body = get_show_episdes(
      query["plex_token"],
      query["server_jws"],
      rating_key=int(safeget(query, "rating_key", default=0))
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
    return

# see: https://stackoverflow.com/a/8187203
class WatchedEpisodeDTO:
  grandparentTitle = str() # Name of the show for the episode
  grandparentGuid = str() # Plex GUID for the show
  parentIndex = int() # Season number of episode
  index = int() # Episode number
  formatted = str()
  guid = str()
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
    self.formatted = f'{self.grandparentTitle} - S{str(self.parentIndex).zfill(2)}E{str(self.index).zfill(2)}'
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

class PaginatedResponseDTO:
  watched: list[WatchedEpisodeDTO]
  totalSize: int
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

def get_show_episdes(plex_token: str, server_jws: str, rating_key: str) -> list[WatchedEpisodeDTO]:
  if verify_uri(server_jws) != "":
    # connect to server directly
    plex = PlexServer(verify_uri(server_jws), plex_token)

    show: Show = plex.fetchItem(rating_key, Show)
    #print(show)
    
    episodes: list[Episode] = show.episodes()
    #print(episodes)

    return [WatchedEpisodeDTO(
      grandparentTitle=item.grandparentTitle,
      #grandparentGuid=item.grandparentGuid,
      grandparentGuid=None,
      parentIndex=item.parentIndex,
      index=item.index,
      guid=item.ratingKey
    ) for item in episodes]
  else:
    return []

if __name__ == "__main__":
  #print(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"))
  print(str(jsonpickle.encode(get_show_episdes(plex_token=os.environ["X_PLEX_TOKEN"], server_jws="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.FOO.BAR"), indent=2)))