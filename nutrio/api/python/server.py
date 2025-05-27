#! /usr/bin/python

from http.server import BaseHTTPRequestHandler

class GetHandler(BaseHTTPRequestHandler):

	def _set_headers(self):
			self.send_response(200)
			self.send_header('Content-type', 'text/html')
			#self.send_header('Access-Control-Allow-Origin', 'http://sebaro.pro')
			self.end_headers()

	def do_HEAD(self):
		self._set_headers()

	def do_GET(self):
		self._set_headers()
		print(self.client_address)
		print(self.headers)
		self.wfile.write('Hello, world!'.encode('utf-8'))
		import index
		index.show()

if __name__ == '__main__':
	from http.server import HTTPServer
	server = HTTPServer(('localhost', 7777), GetHandler)
	print('Starting server, use <Ctrl + F2> to stop')
	server.serve_forever()
