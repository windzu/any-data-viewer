# any-data-viewer

一个用于本地/浏览器快速查看多种数据文件的示例工程。目前已实现：

- Pickle 文件解析与内容查看（通过 Python Flask 后端反序列化后返回 JSON 或字符串）
- PCD 点云文件本地解析与 3D 可视化（基于 three.js / PCDLoader）
- 通用文件上传占位页（后续可扩展为统一调度入口）

> 当前工程为早期原型，重点验证前后端协作与多格式数据快速预览能力。

## 目录结构

```text
any-data-viewer/
├─ README.md                  # 根 README（本文件）
├─ next-frontend/             # Next.js 15 (App Router) 前端
│  ├─ src/app/
│  │  ├─ page.tsx             # 首页
│  │  ├─ pickle-viewer/       # Pickle 文件查看页
│  │  ├─ pcd-viewer/          # PCD 点云查看页
│  │  ├─ upload/              # 通用上传页
│  │  └─ api/parse-pickle/    # 代理后端解析的 API Route
│  └─ package.json
└─ python-backend/            # Flask 后端 (解析 pickle)
   ├─ app.py
   ├─ requirements.txt
   ├─ create_sample_pickle.py # 生成示例 sample.pkl
   └─ sample.pkl
```

## 功能说明

### 1. Pickle 文件查看

前端通过拖拽上传 .pkl / .pickle 文件 -> Next.js API Route (`/api/parse-pickle`) 将二进制转发给后端 Flask `/parse-pickle` -> 后端使用 `pickle.load` 反序列化 -> 将对象：

- 若为 `dict` / `list` -> `json.dumps` 后返回
- 否则转为字符串返回

前端支持展示为 JSON / DICT / TXT 三种视图（本质是不同格式化方式），并提供复制按钮。

### 2. PCD 点云查看

前端本地读取 .pcd 文件（未走后端），使用 `PCDLoader` 解析为 `THREE.Points`，通过 three.js + OrbitControls 进行交互。支持滑杆动态调整点大小（pointSize）。

### 3. 通用上传页

目前仅做拖拽与模拟上传提示。可扩展：

- 根据文件类型自动路由到对应 viewer
- 上传至后端存储 / 队列

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 15 (App Router), React 19, Tailwind CSS 4 | UI + 文件拖拽 + 3D 渲染 |
| 三维 | three.js, PCDLoader, OrbitControls | 点云渲染 |
| 代码高亮 | react-syntax-highlighter | Pickle 内容高亮显示 |
| 后端 | Flask + Flask-Cors | Pickle 解析 API |

## 启动步骤

### 0. 环境要求

- Node.js >= 18
- Python >= 3.9
- 推荐包管理：`pnpm`（也可使用 npm / yarn）

### 1. 启动后端 (Flask)

```bash
cd python-backend
pip install -r requirements.txt
python app.py  # 启动 => 默认 http://localhost:5000
```

### 2. 启动前端 (Next.js)

```bash
cd next-frontend
pnpm install  # 或 npm install / yarn install
# 配置后端地址（可选，如需自定义）
# 创建 .env.local 文件写入：
# PYTHON_BACKEND_URL=http://localhost:5000/parse-pickle
pnpm dev  # 启动开发服务器 => http://localhost:3000
```

访问：

- 首页: <http://localhost:3000>
- Pickle Viewer: <http://localhost:3000/pickle-viewer>
- PCD Viewer: <http://localhost:3000/pcd-viewer>
- 上传页: <http://localhost:3000/upload>

### 3. 变量说明

| 变量 | 作用 | 设置位置 |
|------|------|----------|
| PYTHON_BACKEND_URL | Next.js API Route 转发的后端解析地址 | `.env.local` 或部署平台环境变量 |

未设置时默认使用 `http://localhost:5000/parse-pickle`。

### 4. 生产构建

前端：

```bash
cd next-frontend
pnpm build
pnpm start  # 生产模式启动
```

后端（建议使用 gunicorn / waitress 等 WSGI 服务器）：

```bash
cd python-backend
pip install gunicorn
gunicorn -b 0.0.0.0:5000 app:app
```

## API 说明

### POST /parse-pickle (Flask 后端)

- 表单字段：`file` (multipart/form-data)
- 成功返回示例：

```json
{"parsed_content": "{\"key\": 123}"}
```

- 失败：`{"error": "..."}` + 对应状态码

### POST /api/parse-pickle (Next.js 前端代理)

- 作用：接收浏览器上传的文件并转发到后端（可在未来加鉴权、流式上传等）

## 安全注意 (Pickle)

`pickle.load` 反序列化任意来源数据存在代码执行风险。生产场景应：

1. 仅允许可信来源；
2. 使用受限的反序列化策略（如 `pickle.Unpickler` 自定义 `find_class`）或改用安全格式（JSON / msgpack）；
3. 运行于隔离沙箱。

当前示例为演示用途，未做安全强化。

## 常见问题 (FAQ)

- Pickle 显示乱码 / 不是 JSON：该对象不是 list/dict，会被直接 `str()` 后返回。
- PCD 没有颜色：文件内可能未包含颜色属性，代码默认使用绿色。
- 字体/样式异常：Tailwind CSS 4 仍为新版，注意升级兼容性。

## 后续规划 (Roadmap)

- [ ] 支持更多格式：JSON / CSV / Parquet / HDF5 / LAS / E57 等
- [ ] 点云属性面板（统计点数、范围、颜色图例）
- [ ] 体素化/降采样预览
- [ ] 大文件分片上传与断点续传
- [ ] 统一后端网关（FastAPI / Rust Axum）
- [ ] Docker 一键启动
- [ ] 用户权限与访问控制
- [ ] 国际化 (i18n)

## 开发建议

- 新增数据格式：可在 `src/app/<new-viewer>/page.tsx` 下添加页面，并在首页添加入口链接。
- 若需后端解析：在 `python-backend` 内新增路由，再在 `src/app/api/` 下建立对应代理 Route。

## License

当前未指定 License，如需开源请补充选择 (MIT / Apache-2.0 / BSD-3-Clause 等)。
