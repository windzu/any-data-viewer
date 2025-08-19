import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // In a real application, you would send this buffer to a Python backend.
    // For now, let's create a new FormData to forward it.

    const pythonBackendFormData = new FormData();
    pythonBackendFormData.append('file', new Blob([buffer], { type: file.type }), file.name);

    // IMPORTANT: Replace with your actual Python backend URL if different
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000/parse-pickle';

    const pythonBackendResponse = await fetch(pythonBackendUrl, {
      method: 'POST',
      body: pythonBackendFormData,
    });

    if (!pythonBackendResponse.ok) {
      const errorData = await pythonBackendResponse.text();
      throw new Error(`Python backend error: ${pythonBackendResponse.status} - ${errorData}`);
    }

    const data = await pythonBackendResponse.json();
    return NextResponse.json({ content: data.parsed_content });

  } catch (error: any) {
    console.error('Error in parse-pickle API route:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse pickle file.' }, { status: 500 });
  }
} 