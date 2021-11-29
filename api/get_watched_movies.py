import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.library import MovieSection
from plexapi.myplex import MyPlexAccount
from plexapi.server import PlexServer
from plexapi.video import Movie
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
    response_body = get_watched_movies(
      query["plex_token"],
      query["server_name"],
      skip=int(safeget(query, "skip", default=0)),
      limit=int(safeget(query, "limit", default=10))
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
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

class PaginatedResponseDTO:
  watched: list[WatchedMovieDTO]
  totalSize: int
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def get_watched_movies(plex_token: str, server_name: str, skip=0, limit=10) -> list[WatchedMovieDTO]:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()
    results: list[WatchedMovieDTO] = []
    # only "movie" libraries
    sections: list[MovieSection] = [item for item in plex.library.sections() if item.TYPE == 'movie']

    def fetch_total_size(key: int) -> int:
      res = requests.get(f'{plex._baseurl}/library/sections/{key}/all?type=1&unwatched!=1&X-Plex-Container-Start=0&X-Plex-Container-Size=2&X-Plex-Token={plex_token}', timeout=1, headers={"Accept": "application/json"})
      totalSize = res.json()["MediaContainer"]["totalSize"]
      return totalSize

    # TODO: this doesn't work if you have multiple Movie section libraries, so for now, just don't
    for section in sections:
      totalSize = fetch_total_size(section.key)
      movies: list[Movie] = section.search(unwatched=False, libtype='movie', sort='titleSort', includeGuids=True, container_start=skip, container_size=limit, maxresults=limit)
      results += [WatchedMovieDTO(title=item.title, guid=item.guid) for item in movies]
    return PaginatedResponseDTO(watched=results, totalSize=totalSize)
  else:
    return []

if __name__ == "__main__":
  #print(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"))
  print(str(jsonpickle.encode(get_watched_movies(plex_token=os.environ["X_PLEX_TOKEN"], server_name="mars"), indent=2)))