from flask import Flask, request, jsonify, send_from_directory
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# 🔐 Firebase initialization (local + Render)
if os.environ.get("FIREBASE_KEY"):
    firebase_json = json.loads(os.environ.get("FIREBASE_KEY"))
    cred = credentials.Certificate(firebase_json)
else:
    cred = credentials.Certificate("firebase_key.json")

firebase_admin.initialize_app(cred)
db = firestore.client()

@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/add-item", methods=["POST"])
def add_item():
    data = request.json
    db.collection("items").add(data)
    return jsonify({"message": "Item saved to Firebase"})

@app.route("/items", methods=["GET"])
def get_items():
    items = []
    docs = db.collection("items").stream()
    for doc in docs:
        items.append(doc.to_dict())
    return jsonify(items)

if __name__ == "__main__":
    app.run(debug=True)
