from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os, json

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/static"
)

CORS(app)

# ================= FIREBASE INIT =================
firebase_key = json.loads(os.environ.get("FIREBASE_KEY"))
cred = credentials.Certificate(firebase_key)
firebase_admin.initialize_app(cred)

db = firestore.client()
ADMIN_EMAIL = "abdulwajidm0@gmail.com"

# ================= HOME =================
@app.route("/")
def home():
    return render_template("index.html")

# ================= ITEMS =================
@app.route("/items", methods=["GET", "POST"])
def items():
    if request.method == "POST":
        db.collection("items").add(request.json)
        return jsonify(success=True)

    docs = (
        db.collection("items")
        .order_by("created", direction=firestore.Query.DESCENDING)
        .stream()
    )
    return jsonify([{**d.to_dict(), "id": d.id} for d in docs])

# ================= CLAIM =================
@app.route("/items/<item_id>/claim", methods=["PUT"])
def claim_item(item_id):
    db.collection("items").document(item_id).update({"claimed": True})
    return jsonify(success=True)

# ================= REPORT =================
@app.route("/items/<item_id>/report", methods=["PUT"])
def report_item(item_id):
    db.collection("items").document(item_id).update({"reported": True})
    return jsonify(success=True)

# ================= DELETE =================
@app.route("/items/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    data = request.json or {}
    user_id = data.get("userId")
    user_email = data.get("email")

    ref = db.collection("items").document(item_id)
    doc = ref.get()

    if not doc.exists:
        return jsonify(error="Not found"), 404

    item = doc.to_dict()

    if item.get("ownerId") == user_id or user_email == ADMIN_EMAIL:
        ref.delete()
        return jsonify(success=True)

    return jsonify(error="Unauthorized"), 403
