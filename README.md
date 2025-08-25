# AnyDataViewer

纯前端的多格式数据预览器。支持点云文件 PCD、BIN（默认按 xyzi/float32 解析）与 Python Pickle 文件，所有解析均在浏览器本地完成，无需后端与网络上传。基于 Next.js、Three.js 与 Pyodide 构建，可一键部署到 Vercel。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/windzu/any-data-viewer)

## 功能特性

- 点云预览（PCD / BIN）
  - PCD：使用 three.js 的 PCDLoader 解析
  - BIN：默认按 xyzi/float32 解析并着色（基于强度的 HSL 渐变）
  - 支持调节点大小、拖拽/点击选择文件
- Pickle 预览
  - 通过 Pyodide 在浏览器中本地解析（包含 numpy 支持）
  - 安全反序列化（限制可加载类型），结果可切换 JSON/DICT/TXT 显示并复制
- 上传页便捷入口
  - 在上传页选择文件后，自动跳转到对应预览页，并显示“即将跳转”提示
- 纯前端
  - 无任何服务端依赖，适合静态托管与 Vercel 部署

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000> 查看页面。你可以从首页进入“文件上传”、“PCD 预览”、“Pickle 预览”。

源码入口位于 `src/app`（例如首页 `src/app/page.tsx`）。

## 使用说明

- 推荐从“文件上传”页选择文件：
  - .pcd/.bin 将自动跳转到点云预览页
  - .pkl/.pickle 将自动跳转到 Pickle 预览页
- 也可直接进入对应预览页，拖拽或点击选择文件
- 所有解析在本地完成，不会上传到服务器

## 一键部署到 Vercel

点击上方 “Deploy with Vercel” 按钮，按向导导入仓库即可部署。无需额外配置（使用默认 Next on Vercel）。

## 技术栈

- Next.js (App Router)
- three.js（PCDLoader / 点云渲染）
- Pyodide（浏览器端 Python 运行环境，用于解析 Pickle）

---

本项目由 create-next-app 初始化，并根据需要进行了适配与功能扩展。
