import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 直接把上传的 formData 转发给 Python 后端
  const formData = await req.formData();
  const pythonBackendUrl =
    process.env.PYTHON_BACKEND_URL || 'http://localhost:5000/parse-pickle';

  try {
    const pyRes = await fetch(pythonBackendUrl, { method: 'POST', body: formData });

    // 永远不在这里 throw，原样透传状态码与响应体
    const contentType = pyRes.headers.get('content-type') || 'application/json';
    const bodyText = await pyRes.text();

    return new Response(bodyText, {
      status: pyRes.status,
      headers: { 'content-type': contentType },
    });
  } catch (e: any) {
    // 只有网络异常等不可达情况才会走到这里
    return NextResponse.json(
      { ok: false, error: `Proxy error: ${e?.message || String(e)}` },
      { status: 502 },
    );
  }
}
