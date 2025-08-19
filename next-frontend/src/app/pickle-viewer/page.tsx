'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function PickleViewerPage() {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [displayFormat, setDisplayFormat] = useState<'json' | 'txt' | 'dict'>('json');
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
        setFileContent(null);

        if (file.type !== 'application/octet-stream' && !file.name.endsWith('.pkl') && !file.name.endsWith('.pickle')) {
            setError('请上传有效的 Pickle 文件（.pkl 或 .pickle 格式）。');
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/parse-pickle', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Backend sends content as string, store it as is
            setFileContent(data.content);
        } catch (err: any) {
            setError(`解析文件失败: ${err.message}`);
            console.error('Error parsing pickle file:', err);
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

    const formattedContent = () => {
        if (!fileContent) return '';
        // If format is JSON or Dict, try to pretty-print as JSON
        if (displayFormat === 'json' || displayFormat === 'dict') {
            try {
                return JSON.stringify(JSON.parse(fileContent), null, 2);
            } catch (e) {
                // If not valid JSON, fall back to plain text
                return fileContent;
            }
        }
        // For 'txt' format or if JSON parsing failed
        return fileContent;
    };

    const handleCopy = async () => {
        if (fileContent) {
            try {
                await navigator.clipboard.writeText(formattedContent());
                setCopyButtonText('已复制！');
                setTimeout(() => setCopyButtonText('复制'), 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
                setCopyButtonText('复制失败！');
                setTimeout(() => setCopyButtonText('复制'), 2000);
            }
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
            <Link href="/" className="absolute top-4 left-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out">
                &lt; 返回首页
            </Link>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">Pickle 文件预览</h1>

            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer mb-8 w-full max-w-lg"
            >
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p className="text-gray-600">松开文件即可上传...</p> :
                        <p className="text-gray-600">将 Pickle 文件拖放到此处，或点击选择文件</p>
                }
            </div>

            {fileName && <p className="text-lg font-medium text-gray-700 mb-4">已选择文件: {fileName}</p>}
            {isLoading && <p className="text-lg font-medium text-blue-600">正在解析文件，请稍候...</p>}
            {error && <p className="text-lg font-medium text-red-600">错误: {error}</p>}

            {fileContent && (
                <div className="relative w-full max-w-2xl bg-white p-6 rounded-lg shadow-md overflow-auto max-h-[600px]">
                    <div className="flex justify-start mb-4">
                        <button
                            onClick={() => setDisplayFormat('json')}
                            className={`px-4 py-2 rounded-l-md text-sm font-medium ${displayFormat === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            JSON
                        </button>
                        <button
                            onClick={() => setDisplayFormat('dict')}
                            className={`px-4 py-2 text-sm font-medium ${displayFormat === 'dict' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            DICT
                        </button>
                        <button
                            onClick={() => setDisplayFormat('txt')}
                            className={`px-4 py-2 rounded-r-md text-sm font-medium ${displayFormat === 'txt' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
                    {(displayFormat === 'json' || displayFormat === 'dict') ? (
                        <SyntaxHighlighter language="json" style={solarizedlight} customStyle={{ background: 'transparent' }}>
                            {formattedContent()}
                        </SyntaxHighlighter>
                    ) : (
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded-md">
                            <code>{formattedContent()}</code>
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
} 