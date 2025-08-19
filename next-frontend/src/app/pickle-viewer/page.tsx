'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 新增：懒加载 Pyodide

// 轻量状态缓存，避免多次下载
let pyodidePromise: Promise<any> | null = null;
async function getPyodide() {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Pyodide can only load in browser'));
            return;
        }
        const finishInit = async (py: any) => {
            try {
                // 确保 numpy 已安装
                await py.loadPackage('numpy');
                injectPythonHelpers(py);
                resolve(py);
            } catch (e) {
                reject(e);
            }
        };
        const existing = document.querySelector('script[data-pyodide]') as HTMLScriptElement | null;
        if (existing && (window as any).loadPyodide) {
            (window as any)
                .loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' })
                .then(finishInit)
                .catch(reject);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.async = true;
        script.dataset.pyodide = 'true';
        script.onload = () => {
            (window as any)
                .loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' })
                .then(finishInit)
                .catch(reject);
        };
        script.onerror = () => reject(new Error('Pyodide script load failed'));
        document.head.appendChild(script);
    });
    return pyodidePromise;
}

function injectPythonHelpers(py: any) {
    // 避免重复注入
    if ((py as any)._pickleHelpersInjected) return;
    const pythonCode = `import io, pickle, math, json, base64\nimport numpy as np\n\n# 安全 Unpickler: 禁止自定义类，仅放行 numpy 构造 array 所需的最小集合\nclass SafeUnpickler(pickle.Unpickler):\n    allowed_builtins = {\n        'builtins': {\n            'list','dict','set','tuple','str','int','float','bool','complex','bytes','bytearray','frozenset','range','slice'\n        }\n    }\n    # 允许的 numpy 相关 (重建 ndarray / dtype 时常见)\n    allowed_numpy = {('numpy','ndarray'), ('numpy','dtype')}\n    allowed_numpy_core_multiarray = {'_reconstruct', 'scalar'}\n    allowed_codecs = {'encode','decode'}  # 某些 numpy / dtype 的旧 pickle 需要 _codecs.encode\n    def find_class(self, module, name):\n        if module in self.allowed_builtins and name in self.allowed_builtins[module]:\n            return getattr(__import__(module), name)\n        if (module, name) in self.allowed_numpy:\n            return getattr(__import__(module), name)\n        if module == 'numpy.core.multiarray' and name in self.allowed_numpy_core_multiarray:\n            mod = __import__('numpy.core.multiarray', fromlist=[name])\n            return getattr(mod, name)\n        if module == '_codecs' and name in self.allowed_codecs:\n            mod = __import__('_codecs')\n            return getattr(mod, name)\n        raise pickle.UnpicklingError(f'Blocked class: {module}.{name}')\n\ndef sanitize_json_numbers(x):\n    if isinstance(x, float):\n        if math.isnan(x) or math.isinf(x):\n            return None\n        return x\n    import numpy as _np\n    if isinstance(x, (_np.floating,)):\n        v = float(x)\n        return None if (math.isnan(v) or math.isinf(v)) else v\n    if isinstance(x, (_np.integer,)):\n        return int(x)\n    if isinstance(x, (_np.bool_,)):\n        return bool(x)\n    if isinstance(x, (bytes, bytearray, memoryview)):\n        return {'__bytes__': True, 'base64': base64.b64encode(bytes(x)).decode()}\n    if isinstance(x, dict):\n        return {k: sanitize_json_numbers(v) for k,v in x.items()}\n    if isinstance(x, (list, tuple, set)):\n        return [sanitize_json_numbers(v) for v in x]\n    return x\n\ndef summarize_array(arr, sample_n=10):\n    import numpy as _np\n    flat = arr.ravel()\n    finite = flat[_np.isfinite(flat)] if flat.size else flat\n    min_v = float(finite.min()) if finite.size else None\n    max_v = float(finite.max()) if finite.size else None\n    sample = flat[:sample_n].tolist()\n    sample = sanitize_json_numbers(sample)\n    return {\n        '__ndarray__': True,\n        'dtype': str(arr.dtype),\n        'shape': list(arr.shape),\n        'min': min_v,\n        'max': max_v,\n        'sample': sample,\n    }\n\ndef to_serializable(obj, summarize_large=True, elem_threshold=20000):\n    import numpy as _np\n    if isinstance(obj, _np.ndarray):\n        if summarize_large and obj.size > elem_threshold:\n            return summarize_array(obj)\n        return sanitize_json_numbers(obj.tolist())\n    if isinstance(obj, (_np.integer, _np.floating, _np.bool_)):\n        return sanitize_json_numbers(obj.item())\n    if isinstance(obj, (bytes, bytearray, memoryview)):\n        return {'__bytes__': True, 'base64': base64.b64encode(bytes(obj)).decode()}\n    if isinstance(obj, set):\n        return [to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for v in obj]\n    if isinstance(obj, tuple):\n        return [to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for v in obj]\n    if isinstance(obj, dict):\n        return {k: to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for k,v in obj.items()}\n    if isinstance(obj, list):\n        return [to_serializable(v, summarize_large=summarize_large, elem_threshold=elem_threshold) for v in obj]\n    return sanitize_json_numbers(obj)\n\ndef parse_pickle_bytes(b: bytes):\n    try:\n        bio = io.BytesIO(b)\n        obj = SafeUnpickler(bio).load()\n        safe = to_serializable(obj, summarize_large=True, elem_threshold=20000)\n        return json.dumps({'ok': True, 'parsed_content': safe}, ensure_ascii=False, allow_nan=False)\n    except Exception as e:\n        return json.dumps({'ok': False, 'error': f'{type(e).__name__}: {e}'}, ensure_ascii=False, allow_nan=False)`;
    py.runPython(pythonCode);
    (py as any)._pickleHelpersInjected = true;
}

type DisplayFormat = 'json' | 'txt' | 'dict';

function toDisplayString(val: unknown): string {
    if (typeof val === 'string') return val;
    try {
        return JSON.stringify(val, null, 2);
    } catch {
        return String(val);
    }
}

export default function PickleViewerPage() {
    const [fileContent, setFileContent] = useState<string>(''); // 始终存字符串
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('json');
    const [copyButtonText, setCopyButtonText] = useState('复制');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) {
            setError('请选择一个文件。');
            return;
        }
        const file = acceptedFiles[0];
        setFileName(file.name);
        setIsLoading(true);
        setError(null);
        setFileContent('');

        if (
            file.type !== 'application/octet-stream' &&
            !file.name.endsWith('.pkl') &&
            !file.name.endsWith('.pickle')
        ) {
            setError('请上传有效的 Pickle 文件（.pkl 或 .pickle 格式）。');
            setIsLoading(false);
            return;
        }

        try {
            const buf = await file.arrayBuffer();
            const bytes = new Uint8Array(buf);
            const py = await getPyodide();
            // 使用虚拟文件系统写入，避免构造超长 Python 源导致 MemoryError
            const tmpPath = '/tmp_upload.pkl';
            py.FS.writeFile(tmpPath, bytes);
            let resultJson: string;
            try {
                resultJson = py.runPython(`parse_pickle_bytes(open('${tmpPath}','rb').read())`);
            } finally {
                try { py.FS.unlink(tmpPath); } catch { /* ignore */ }
            }
            let body: any;
            try {
                body = JSON.parse(resultJson);
            } catch (e) {
                setError('解析结果不是有效 JSON');
                return;
            }
            if (!body?.ok) {
                setError(body?.error || '解析失败');
                return;
            }
            const content = body.parsed_content;
            setFileContent(toDisplayString(content));
        } catch (err: any) {
            setError(`本地解析失败: ${err?.message || String(err)}`);
            // eslint-disable-next-line no-console
            console.error('Local pickle parse error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/octet-stream': ['.pkl', '.pickle'],
        },
    });

    const formattedContent = (): string => {
        if (!fileContent) return '';
        if (displayFormat === 'json' || displayFormat === 'dict') {
            // 尝试把 fileContent 当 JSON 再美化一次；不行就原样返回
            try {
                return JSON.stringify(JSON.parse(fileContent), null, 2);
            } catch {
                return fileContent;
            }
        }
        return fileContent; // 'txt'
    };

    const handleCopy = async () => {
        const text = formattedContent();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopyButtonText('已复制！');
            setTimeout(() => setCopyButtonText('复制'), 2000);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to copy: ', err);
            setCopyButtonText('复制失败！');
            setTimeout(() => setCopyButtonText('复制'), 2000);
        }
    };

    const codeString = formattedContent(); // ✅ 确保传入高亮器的是 string

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
            <Link
                href="/"
                className="absolute top-4 left-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
            >
                &lt; 返回首页
            </Link>

            <h1 className="text-4xl font-bold mb-4 text-gray-800">Pickle 文件预览</h1>

            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer mb-8 w-full max-w-lg bg-white"
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p className="text-gray-600">松开文件即可上传...</p>
                ) : (
                    <p className="text-gray-600">将 Pickle 文件拖放到此处，或点击选择文件（前端本地解析，无上传）</p>
                )}
            </div>

            {fileName && (
                <p className="text-lg font-medium text-gray-700 mb-2">已选择文件: {fileName}</p>
            )}
            {isLoading && (
                <p className="text-lg font-medium text-blue-600 mb-2">加载/解析中，首次使用需下载 Pyodide 体积较大...</p>
            )}
            {error && (
                <p className="text-lg font-medium text-red-600 mb-4">错误: {error}</p>
            )}

            {codeString && (
                <div className="relative w-full max-w-3xl bg-white p-6 rounded-lg shadow-md overflow-auto max-h-[70vh]">
                    <div className="flex justify-start mb-4">
                        <button
                            onClick={() => setDisplayFormat('json')}
                            className={`px-4 py-2 rounded-l-md text-sm font-medium ${displayFormat === 'json'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            JSON
                        </button>
                        <button
                            onClick={() => setDisplayFormat('dict')}
                            className={`px-4 py-2 text-sm font-medium ${displayFormat === 'dict'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            DICT
                        </button>
                        <button
                            onClick={() => setDisplayFormat('txt')}
                            className={`px-4 py-2 rounded-r-md text-sm font-medium ${displayFormat === 'txt'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            TXT
                        </button>
                    </div>

                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 bg-gray-700 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-800 transition-colors"
                    >
                        {copyButtonText}
                    </button>

                    <h2 className="text-xl font-semibold mb-4">文件内容:</h2>

                    {displayFormat === 'txt' ? (
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded-md">
                            <code>{codeString}</code>
                        </pre>
                    ) : (
                        <SyntaxHighlighter
                            language="json"
                            style={solarizedlight}
                            customStyle={{ background: 'transparent' }}
                            wrapLongLines
                        >
                            {codeString /* ✅ 始终是 string */}
                        </SyntaxHighlighter>
                    )}
                </div>
            )}
        </div>
    );
}
