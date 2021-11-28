import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from plexapi.video import Movie

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    response_body = get_watched_movies(query["plex_token"], query["server_name"])
    self.wfile.write(str(jsonpickle.encode(response_body, indent=2)).encode())
    return

# see: https://stackoverflow.com/a/8187203
class WatchedMovieDTO:
  title = str()
  guid = str()
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def get_watched_movies(plex_token: str, server_name: str) -> list[WatchedMovieDTO]:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()
    movies: list[Movie] = plex.library.search(unwatched=False, libtype='movie', includeGuids=True, maxresults=99999999)
    return [WatchedMovieDTO(title=item.title, guid=item.guid) for item in movies]
  else:
    return []

if __name__ == "__main__":
  #print(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"))
  print(str(jsonpickle.encode(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"), indent=2)))