import base64
import io
import json
import math
import pickle

import numpy as np
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def sanitize_json_numbers(x):
    """将 NaN/Inf 转为 None，递归处理 dict/list/tuple/标量/np.* 标量"""
    if isinstance(x, float):
        if math.isnan(x) or math.isinf(x):
            return None
        return x
    if isinstance(x, (np.floating,)):
        v = float(x)
        return None if (math.isnan(v) or math.isinf(v)) else v
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, (np.bool_,)):
        return bool(x)
    if isinstance(x, (bytes, bytearray, memoryview)):
        return {"__bytes__": True, "base64": base64.b64encode(bytes(x)).decode()}
    if isinstance(x, dict):
        return {k: sanitize_json_numbers(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [sanitize_json_numbers(v) for v in x]
    return x  # 其它类型保持不变（str/int/bool/None）

def summarize_array(arr: np.ndarray, sample_n=10):
    flat = arr.ravel()
    # 先把浮点里的 NaN/Inf 清洗，再统计
    finite = flat[np.isfinite(flat)] if flat.size else flat
    min_v = float(finite.min()) if finite.size else None
    max_v = float(finite.max()) if finite.size else None
    sample = flat[:sample_n].tolist()
    sample = sanitize_json_numbers(sample)
    return {
        "__ndarray__": True,
        "dtype": str(arr.dtype),
        "shape": list(arr.shape),
        "min": min_v,
        "max": max_v,
        "sample": sample,
    }

def to_serializable(obj, *, summarize_large=True, elem_threshold=20000):
    if isinstance(obj, np.ndarray):
        if not obj.flags["C_CONTIGUOUS"]:
            obj = np.ascontiguousarray(obj)
        if summarize_large and obj.size > elem_threshold:
            return summarize_array(obj)
        return sanitize_json_numbers(obj.tolist())

    if isinstance(obj, (np.integer, np.floating, np.bool_)):
        return sanitize_json_numbers(obj.item())

    if isinstance(obj, (bytes, bytearray, memoryview)):
        return {"__bytes__": True, "base64": base64.b64encode(bytes(obj)).decode()}

    if isinstance(obj, set):
        return [to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for v in obj]
    if isinstance(obj, tuple):
        return [to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for v in obj]

    if isinstance(obj, dict):
        return {k: to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for v in obj]

    # 其余尽量保持原样，但要确保严格 JSON
    return sanitize_json_numbers(obj)

@app.route("/parse-pickle", methods=["POST"])
def parse_pickle():
    try:
        if "file" not in request.files:
            return Response(json.dumps({"ok": False, "error": "No file part in the request"}, allow_nan=False),
                            mimetype="application/json", status=400)

        file = request.files["file"]
        if not file.filename:
            return Response(json.dumps({"ok": False, "error": "No selected file"}, allow_nan=False),
                            mimetype="application/json", status=400)

        data = pickle.load(io.BytesIO(file.read()))
        safe = to_serializable(data, summarize_large=True, elem_threshold=20000)

        payload = json.dumps({"ok": True, "parsed_content": safe}, ensure_ascii=False, allow_nan=False)
        return Response(payload, mimetype="application/json", status=200)

    except Exception as e:
        # 统一 400，且一定是严格 JSON
        err = json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}, ensure_ascii=False, allow_nan=False)
        return Response(err, mimetype="application/json", status=400)

if __name__ == "__main__":
    app.run("0.0.0.0", 5000, debug=True)
