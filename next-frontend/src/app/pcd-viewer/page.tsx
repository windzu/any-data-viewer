'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import ThreeDViewer from '../components/ThreeDViewer';

export default function PcdViewerPage() {
    const [model, setModel] = useState<THREE.Object3D | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [pointSize, setPointSize] = useState<number>(0.01); // Default point size

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) {
            setError('请选择一个文件。');
            return;
        }
        const file = acceptedFiles[0];
        setFileName(file.name);
        setIsLoading(true);
        setError(null);
        setModel(null); // Clear previous model

        if (!file.name.endsWith('.pcd')) {
            setError('请上传有效的 PCD 文件（.pcd 格式）。');
            setIsLoading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (event.target?.result) {
                    const loader = new PCDLoader();
                    const loadedModel = loader.parse(event.target.result as ArrayBuffer);

                    // Apply point size and color based on data if available
                    if (loadedModel instanceof THREE.Points) {
                        (loadedModel.material as THREE.PointsMaterial).size = pointSize;
                        if (loadedModel.geometry.hasAttribute('color')) {
                            (loadedModel.material as THREE.PointsMaterial).vertexColors = true;
                        } else {
                            (loadedModel.material as THREE.PointsMaterial).vertexColors = false;
                            // Default color if no vertex colors
                            (loadedModel.material as THREE.PointsMaterial).color = new THREE.Color(0x00ff00);
                        }
                    }
                    setModel(loadedModel);
                }
            } catch (err: any) {
                setError(`解析PCD文件失败: ${err.message}`);
                console.error('Error parsing PCD file:', err);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    }, []); // Rerun onDrop if pointSize changes to re-apply size

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'model/x-pointcloud': ['.pcd'],
        },
    });

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 relative">
            <Link href="/" className="absolute top-4 left-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out">
                &lt; 返回首页
            </Link>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">PCD 文件预览 (3D)</h1>

            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer mb-8 w-full max-w-lg"
            >
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p className="text-gray-600">松开文件即可上传...</p> :
                        <p className="text-gray-600">将 PCD 文件拖放到此处，或点击选择文件</p>
                }
            </div>

            {fileName && <p className="text-lg font-medium text-gray-700 mb-4">已选择文件: {fileName}</p>}
            {isLoading && <p className="text-lg font-medium text-blue-600">正在加载和渲染，请稍候...</p>}
            {error && <p className="text-lg font-medium text-red-600">错误: {error}</p>}

            <div className="w-full max-w-full bg-white rounded-lg shadow-md overflow-hidden relative" style={{ height: 'calc(100vh - 150px)' }}>
                <ThreeDViewer model={model} pointSize={pointSize} />
                {model && (
                    <div className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow-md flex flex-col items-start space-y-2">
                        <label htmlFor="pointSize" className="text-sm font-medium text-gray-700">点大小:</label>
                        <input
                            type="range"
                            id="pointSize"
                            min="0.001"
                            max="0.1"
                            step="0.001"
                            value={pointSize}
                            onChange={(e) => setPointSize(parseFloat(e.target.value))}
                            className="w-32"
                        />
                        <span className="text-xs text-gray-500">{pointSize.toFixed(3)}</span>
                    </div>
                )}
            </div>
            <p className="mt-4 text-gray-600">此处将加载并显示PCD点云数据。</p>
        </div>
    );
} 