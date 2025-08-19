import io
import json
import pickle

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all origins, adjust for production


@app.route("/parse-pickle", methods=["POST"])
def parse_pickle():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file:
        try:
            # Use io.BytesIO to read the file content as bytes
            file_bytes = io.BytesIO(file.read())
            # For security, consider restricting what can be unpickled if safety is a concern.
            # Since you've mentioned no security requirements, we'll proceed directly.
            data = pickle.load(file_bytes)

            # If data is a dict or list, return it as a JSON string
            if isinstance(data, (dict, list)):
                return jsonify({"parsed_content": json.dumps(data)})
            else:
                return jsonify(
                    {"parsed_content": str(data)}
                )  # Convert to string for JSON
        except Exception as e:
            return jsonify({"error": f"Failed to parse pickle file: {str(e)}"}), 500
    return jsonify({"error": "Unknown error during file processing"}), 500


if __name__ == "__main__":
    # It's recommended to use Gunicorn or other WSGI server for production
    app.run(host="0.0.0.0", port=5000, debug=True)
