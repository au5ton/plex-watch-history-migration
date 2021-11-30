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
    response_body = get_ondeck(
      query["plex_token"],
      query["server_name"]
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
    return

# see: https://stackoverflow.com/a/8187203
class OnDeckItemDTO:
  title = str()
  guid = str() # Either the guid for a movie or an episode
  type = str() # Either "movie" or "episode"
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def get_ondeck(plex_token: str, server_name: str) -> list[OnDeckItemDTO]:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()
    results: list[OnDeckItemDTO] = []
    sections: list[LibrarySection] = plex.library.sections()
    # for all sections
    for section in sections:
      # save the "on deck" items and what type of content they are
      results += [OnDeckItemDTO(title=item.title, guid=item.guid, type=item.type) for item in section.onDeck()]
    return results
  else:
    return []

if __name__ == "__main__":
  #print(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"))
  print(str(jsonpickle.encode(get_ondeck(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"), indent=2)))