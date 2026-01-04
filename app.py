from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os, json

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Firebase credentials from ENV
firebase_key = json.loads(os.environ.get("FIREBASE_KEY"))
cred = credentials.Certificate(firebase_key)

firebase_admin.initialize_app(cred)
db = firestore.client()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/items", methods=["GET", "POST"])
def items():
    if request.method == "POST":
        db.collection("items").add(request.json)
        return jsonify(success=True)

    docs = db.collection("items").order_by(
        "created", direction=firestore.Query.DESCENDING
    ).stream()

    return jsonify([{**d.to_dict(), "id": d.id} for d in docs])

if __name__ == "__main__":
    app.run(debug=True)
