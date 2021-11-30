import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.library import LibrarySection
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from typing import Any

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
    response_body = get_continue_watching(
      query["plex_token"],
      query["server_name"]
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
    return

# see: https://stackoverflow.com/a/8187203
class OnDeckShowDTO:
  grandparentTitle = str()
  grandparentGuid = str()
  episodeRatingKey = int() # ratingKey of the episode that appeared in the hub
  server = str() # Server name where this came from (because rating keys are unique to the server)
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def get_continue_watching(plex_token: str, server_name: str) -> list[OnDeckShowDTO]:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()
    results: list[OnDeckShowDTO] = []

    # xml response
    res = plex.query('/hubs/continueWatching')
    # locals named after XML <tag>
    hub = res[0]
    for video in hub:
      type = video.get('type')
      if type == 'episode':
        grandparentTitle = video.get('grandparentTitle')
        grandparentGuid = video.get('grandparentGuid')
        ratingKey = video.get('ratingKey')
        results.append(OnDeckShowDTO(
          grandparentTitle=grandparentTitle,
          grandparentGuid=grandparentGuid,
          episodeRatingKey=ratingKey,
          server=server_name
          ))

    return results
  else:
    return []

if __name__ == "__main__":
  #print(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"))
  print(str(jsonpickle.encode(get_continue_watching(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"), indent=2)))