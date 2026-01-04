from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os, json

app = Flask(__name__, static_folder=".", template_folder=".")
CORS(app)

# ================= FIREBASE INIT =================
firebase_key = os.environ.get("FIREBASE_KEY")
if not firebase_key:
    raise Exception("FIREBASE_KEY env variable not set")

cred = credentials.Certificate(json.loads(firebase_key))

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ================= ROUTES =================
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/items", methods=["GET", "POST"])
def items():
    if request.method == "POST":
        db.collection("items").add(request.json)
        return jsonify(success=True)

    docs = db.collection("items") \
        .order_by("created", direction=firestore.Query.DESCENDING) \
        .stream()

    return jsonify([{**d.to_dict(), "id": d.id} for d in docs])

@app.route("/items/<id>/claim", methods=["PUT"])
def claim_item(id):
    db.collection("items").document(id).update({"claimed": True})
    return jsonify(success=True)

@app.route("/items/<id>/report", methods=["PUT"])
def report_item(id):
    db.collection("items").document(id).update({"reported": True})
    return jsonify(success=True)

@app.route("/items/<id>", methods=["DELETE"])
def delete_item(id):
    db.collection("items").document(id).delete()
    return jsonify(success=True)

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)
