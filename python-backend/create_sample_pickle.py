import pickle

data = {
    "name": "示例数据",
    "version": 1.0,
    "details": {"items": ["item1", "item2", "item3"], "value": 123.45, "status": True},
    "list_of_numbers": [1, 2, 3, 4, 5],
}

with open("sample.pkl", "wb") as f:
    pickle.dump(data, f)

print("sample.pkl 已创建在 python-backend 目录中。")
