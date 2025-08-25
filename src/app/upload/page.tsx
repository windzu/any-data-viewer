'use client';

import { setPendingFile } from '@/lib/pendingFiles';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<string>('');
    const router = useRouter();

    const handleRouteByExt = (file: File) => {
        const name = file.name.toLowerCase();
        if (name.endsWith('.pcd') || name.endsWith('.bin')) {
            setPendingFile('pointcloud', file);
            setStatus(`已选择 ${file.name}，即将跳转到点云预览页...`);
            setTimeout(() => router.push('/pcd-viewer'), 500);
            return;
        }
        if (name.endsWith('.pkl') || name.endsWith('.pickle')) {
            setPendingFile('pickle', file);
            setStatus(`已选择 ${file.name}，即将跳转到 Pickle 预览页...`);
            setTimeout(() => router.push('/pickle-viewer'), 500);
            return;
        }
        setStatus('不支持的文件类型，请选择 .pcd / .bin / .pkl / .pickle');
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return;
        const file = acceptedFiles[0]; // 仅处理首个
        setFiles([file]);
        handleRouteByExt(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 bg-gray-100">
            <h1 className="text-4xl font-bold mb-8 text-gray-800">文件上传与预览</h1>

            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer mb-8 w-full max-w-lg bg-white"
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p className="text-gray-600">松开文件即可选择...</p>
                ) : (
                    <p className="text-gray-600">将文件拖放到此处，或点击选择文件（本地解析，无上传服务器）</p>
                )}
            </div>

            {files.length > 0 && (
                <div className="mb-4 text-gray-700">
                    已选择文件: {files[0].name}
                </div>
            )}

            {status && (
                <div className="mt-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded">
                    {status}
                </div>
            )}
        </div>
    );
}