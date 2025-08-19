'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
        setUploadStatus('文件已选择，等待上传或处理...');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleUpload = async () => {
        if (files.length === 0) {
            setUploadStatus('请先选择文件。');
            return;
        }

        setUploadStatus('正在上传...');
        // Here you would typically send the files to a backend API
        // For now, we'll simulate an upload
        setTimeout(() => {
            setUploadStatus('文件上传成功！');
            // Depending on the file type, you might redirect to a viewer page
            // For example, if it's a .pcd file, navigate to /pcd-viewer with file data
            console.log('Files uploaded:', files);
            setFiles([]); // Clear files after simulated upload
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 bg-gray-100">
            <h1 className="text-4xl font-bold mb-8 text-gray-800">文件上传与预览</h1>

            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer mb-8 w-full max-w-lg"
            >
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p className="text-gray-600">松开文件即可上传...</p> :
                        <p className="text-gray-600">将文件拖放到此处，或点击选择文件</p>
                }
            </div>

            {files.length > 0 && (
                <div className="mb-8 w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">已选择文件:</h2>
                    <ul>
                        {files.map((file, index) => (
                            <li key={index} className="text-gray-700">{file.name} - {(file.size / 1024).toFixed(2)} KB</li>
                        ))}
                    </ul>
                    <button
                        onClick={handleUpload}
                        className="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 ease-in-out"
                    >
                        处理文件
                    </button>
                </div>
            )}

            {uploadStatus && <p className="text-lg font-medium text-gray-700">{uploadStatus}</p>}
        </div>
    );
} 