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
import concurrent.futures
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
    response_body = remove_from_continue_watching(
      query["plex_token"],
      query["server_name"],
      query["rating_key"]
      )
    self.wfile.write(str(jsonpickle.encode(response_body)).encode())
    return

def remove_from_continue_watching(plex_token: str, server_name: str, rating_key: str) -> str:
  account = MyPlexAccount(token=plex_token)
  # only the server we're looking for
  servers = [item for item in account.resources() if item.product == 'Plex Media Server' and item.name == server_name]
  if len(servers) > 0:
    # first server with matching name
    server = servers[0]
    plex: PlexServer = server.connect()

    url = f'{plex._baseurl}/actions/removeFromContinueWatching?ratingKey={rating_key}'
    res = requests.put(url, headers={"X-Plex-Token": plex_token}, timeout=2)
    
    return f'{res.status_code}'
  else:
    return []

if __name__ == "__main__":
  print(str(jsonpickle.encode(remove_from_continue_watching(plex_token=os.environ["X_PLEX_TOKEN"], server_name="jupiter", rating_key="4766"), indent=2)))