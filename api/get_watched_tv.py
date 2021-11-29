import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.library import ShowSection
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from plexapi.video import Episode

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.end_headers()
    response_body = get_watched_tv(query["plex_token"], query["server_name"])
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
    return

# see: https://stackoverflow.com/a/8187203
class WatchedEpisodeDTO:
  grandparentTitle = str() # Name of the show for the episode
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

def get_watched_tv(plex_token: str, server_name: str) -> list[WatchedEpisodeDTO]:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()
    results: list[WatchedEpisodeDTO] = []
    # only "movie" libraries
    sections: list[ShowSection] = [item for item in plex.library.sections() if item.TYPE == 'show']
    for section in sections:
      episodes: list[Episode] = section.search(unwatched=False, libtype='episode', includeGuids=True, maxresults=99999999)
      results += [
        WatchedEpisodeDTO(
          grandparentTitle=item.grandparentTitle,
          parentIndex=item.parentIndex,
          index=item.index,
          guid=item.guid)
        for item in episodes
      ]
    return results
  else:
    return []

if __name__ == "__main__":
  #print(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"))
  print(str(jsonpickle.encode(get_watched_tv(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"), indent=2)))