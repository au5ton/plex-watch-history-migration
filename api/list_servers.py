import os
import json
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.myplex import MyPlexAccount

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    response_body = list_servers(query["plex_token"])
    self.wfile.write(str(json.dumps(response_body)).encode())
    return

def list_servers(plex_token: str) -> list[str]:
  account = MyPlexAccount(token=plex_token)
  return [item.name for item in account.resources() if item.product == 'Plex Media Server']

if __name__ == "__main__":
  print(list_servers(plex_token=os.environ["X_PLEX_TOKEN"]))