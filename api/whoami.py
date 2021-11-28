import os
import json
import jsonpickle
from http.server import BaseHTTPRequestHandler
from urllib import parse
from plexapi.myplex import MyPlexAccount

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    query = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.end_headers()
    response_body = whoami(query["plex_token"])
    self.wfile.write(str(json.dumps(response_body)).encode())
    return

class UserDTO:
  username = str()
  email = str()
  uuid = str()
  def __init__(self, **kwargs):
    for key, value in kwargs.items():
      setattr(self, key, value)
  def __repr__(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

def whoami(plex_token: str) -> UserDTO:
  account = MyPlexAccount(token=plex_token)
  return UserDTO(username=account.username, email=account.email, uuid=account.uuid)

if __name__ == "__main__":
  #print(whoami(plex_token=os.environ["X_PLEX_TOKEN"]))
  print(str(jsonpickle.encode(whoami(plex_token=os.environ["X_PLEX_TOKEN"]))))