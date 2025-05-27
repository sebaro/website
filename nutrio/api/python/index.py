
import json

# Food     {"id": row[0], "description": row[2]}
# Nutrient {"id": row[0], "name": row[1], "unit": row[2]}
# Values   {"food_id": row[1], "nutrient_id": row[2], "amount": row[3]}

#query = {"method": "search", "type": "food", "string": "banana apple", "results": "50"}
#query = {"method": "search", "type": "nutrient", "string": "1114or1110", "results": "50"}

def find(string, words):
	i = 0
	for word in words:
		if word.casefold() in string.casefold():
			i += 1
	if i == len(words):
		return True
	else:
		return False

def format_number(num):
  if num % 1 == 0:
    return int(num)
  else:
    return num

def get_data(query):
	data = []
	with open("data.json") as j:
		j = json.load(j)
	if query["method"] == "search":
		if query["type"] == "food":
			for e in j["food"]:
				if find(e["description"], query["string"].split(" ")):
					data.append({"id": e["id"], "name": e["description"]});
					if len(data) >= int(query["results"]):
						break
			data = sorted(data, key=lambda d: d["name"], reverse=False)
		else:
			logical = ""
			search = query["string"].split(" ")
			if "or" in query["string"]:
				logical = "or"
				search = query["string"].split("or")
			elif "and" in query["string"]:
				logical = "and"
				search = query["string"].split("and")
			units = {}
			for e in j["nutrient"]:
				if e["id"] in search:
					unit = 1
					if e["unit"] == "G":
						unit = 1000000
					elif e["unit"] == "MG":
						unit = 1000
					elif e["unit"] == "IU":
						unit = 0.3
					units[e["id"]] = unit
			#print(units)
			values = {}
			for e in j["food_nutrient"]:
				if e["nutrient_id"] in search:
					if e["amount"]:
						if e["food_id"] not in values:
							values[e["food_id"]] = {}
						value = round(float(e["amount"]) * float(units[e["nutrient_id"]]), 3)
						value = f"{value:g}"
						values[e["food_id"]][e["nutrient_id"]] = value
			#print(values["175234"])
			for e in j["food"]:
				value = 0
				if logical == "or":
					for s in search:
						if e["id"] in values and s in values[e["id"]].keys():
							value = values[e["id"]][s]
							break
				elif logical == "and":
					for s in search:
						if e["id"] in values and s in values[e["id"]].keys():
							value += values[e["id"]][s]
							break
				else:
					if e["id"] in values and search[0] in values[e["id"]]:
						value = values[e["id"]][search[0]]
				value = format_number(float(value))
				data.append({"id": e["id"], "name": e["description"], "value": value});
			data = sorted(data, key=lambda d: d["value"], reverse=True)
			data = data[0:int(query["results"])]
	else:
		values = {}
		for e in j["food_nutrient"]:
			if e["food_id"] == query["string"]:
				values[e["nutrient_id"]] = e["amount"]
		for e in j["nutrient"]:
			if e["id"] in values:
				data.append({"id": e["id"], "name": e["name"], "unit": e["unit"], "value": values[e["id"]]})
	return data

from http.server import BaseHTTPRequestHandler

class GetHandler(BaseHTTPRequestHandler):

	def set_headers(self):
			self.send_response(200)
			self.send_header('Content-type', 'text/html')
			self.send_header('Access-Control-Allow-Origin', '*')
			self.end_headers()

	def do_HEAD(self):
		self._set_headers()

	def do_POST(self):
		content_length = int(self.headers['Content-Length'])
		post_data = self.rfile.read(content_length)
		query = json.loads(post_data)
		self.set_headers()
		data = get_data(query)
		if len(data) > 0:
			self.wfile.write(json.dumps(data).encode('utf-8'))
		else:
			self.wfile.write(json.dumps({"errors":"No results found"}).encode('utf-8'))
		return

if __name__ == '__main__':
	from http.server import HTTPServer
	server = HTTPServer(('localhost', 7777), GetHandler)
	print('Starting server, use <Ctrl + F2> to stop')
	server.serve_forever()

