from http.server import BaseHTTPRequestHandler
from datetime import datetime
from plexapi.myplex import MyPlexAccount

from ..lib import util

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    print(MyPlexAccount)
    util.do_thing()
    self.send_response(200)
    self.send_header('Content-type', 'text/plain')
    self.end_headers()
    self.wfile.write(str(datetime.now().strftime('%Y-%m-%d %H:%M:%S')).encode())
    return
