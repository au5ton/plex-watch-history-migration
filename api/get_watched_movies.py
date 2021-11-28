import os
import json
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from plexapi.library import MovieSection
from plexapi.video import Movie

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    response_body = get_watched_movies(query["plex_token"], query["server_name"])
    self.wfile.write(str(json.dumps(response_body)).encode())
    return

def get_watched_movies(plex_token: str, server_name: str) -> list[str]:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()
    # only "movie" libraries
    sections: list[MovieSection] = [item for item in plex.library.sections() if item.TYPE == 'movie']
    for section in sections:
      results: list[Movie] = section.search(unwatched=False, libtype='movie', maxresults=99999999)
      print(f'{len(results)} results found.')
      for movie in results:
        print(movie.title)
        print(movie.guids)
    return []
  else:
    return []

if __name__ == "__main__":
  print(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"))