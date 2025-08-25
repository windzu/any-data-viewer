'use client';

import { popPendingFile } from '@/lib/pendingFiles';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import ThreeDViewer from '../components/ThreeDViewer';

export default function PcdViewerPage() {
    const [model, setModel] = useState<THREE.Object3D | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [pointSize, setPointSize] = useState<number>(0.01); // Default point size

    const parsePointCloudFile = useCallback(async (file: File) => {
        setFileName(file.name);
        setIsLoading(true);
        setError(null);
        setModel(null);

        const isPCD = file.name.toLowerCase().endsWith('.pcd');
        const isBIN = file.name.toLowerCase().endsWith('.bin');
        if (!isPCD && !isBIN) {
            setError('请上传有效的 PCD 或 BIN 文件（.pcd / .bin 格式）。');
            setIsLoading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (!event.target?.result) return;
                if (isPCD) {
                    const loader = new PCDLoader();
                    const loadedModel = loader.parse(event.target.result as ArrayBuffer);
                    if (loadedModel instanceof THREE.Points) {
                        (loadedModel.material as THREE.PointsMaterial).size = pointSize;
                        if (loadedModel.geometry.hasAttribute('color')) {
                            (loadedModel.material as THREE.PointsMaterial).vertexColors = true;
                        } else {
                            (loadedModel.material as THREE.PointsMaterial).vertexColors = false;
                            (loadedModel.material as THREE.PointsMaterial).color = new THREE.Color(0x00ff00);
                        }
                    }
                    setModel(loadedModel);
                } else if (isBIN) {
                    const buffer = event.target.result as ArrayBuffer;
                    const floatArray = new Float32Array(buffer);
                    if (floatArray.length % 4 !== 0) {
                        throw new Error(`无法按 xyzi 解析：数据长度 ${floatArray.length} 不是4的倍数。`);
                    }
                    const numPoints = floatArray.length / 4;
                    const positions = new Float32Array(numPoints * 3);
                    const colors = new Float32Array(numPoints * 3);
                    let minI = Number.POSITIVE_INFINITY;
                    let maxI = Number.NEGATIVE_INFINITY;
                    for (let i = 0; i < floatArray.length; i += 4) {
                        const intensity = floatArray[i + 3];
                        if (intensity < minI) minI = intensity;
                        if (intensity > maxI) maxI = intensity;
                    }
                    const rangeI = maxI - minI || 1;
                    const color = new THREE.Color();
                    for (let p = 0, i = 0; p < numPoints; p++, i += 4) {
                        const x = floatArray[i];
                        const y = floatArray[i + 1];
                        const z = floatArray[i + 2];
                        const intensity = floatArray[i + 3];
                        positions[p * 3] = x;
                        positions[p * 3 + 1] = y;
                        positions[p * 3 + 2] = z;
                        const t = (intensity - minI) / rangeI;
                        color.setHSL((1 - t) * 2 / 3, 1.0, 0.5);
                        colors[p * 3] = color.r;
                        colors[p * 3 + 1] = color.g;
                        colors[p * 3 + 2] = color.b;
                    }
                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                    geometry.computeBoundingBox();
                    const material = new THREE.PointsMaterial({ size: pointSize, vertexColors: true });
                    const points = new THREE.Points(geometry, material);
                    setModel(points);
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                setError(`解析文件失败: ${msg}`);
                console.error('Error parsing point cloud file:', err);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    }, [pointSize]);

    useEffect(() => {
        const pending = popPendingFile('pointcloud');
        if (pending) {
            setInfo('已从上传页带入文件，正在解析...');
            parsePointCloudFile(pending);
            const t = setTimeout(() => setInfo(null), 1500);
            return () => clearTimeout(t);
        }
        return;
    }, [parsePointCloudFile]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) {
            setError('请选择一个文件。');
            return;
        }
        parsePointCloudFile(acceptedFiles[0]);
    }, [parsePointCloudFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'model/x-pointcloud': ['.pcd'],
            'application/octet-stream': ['.bin'],
        },
    });

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 relative">
            <Link href="/" className="absolute top-4 left-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out">
                &lt; 返回首页
            </Link>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">PCD / BIN 文件预览 (3D)</h1>

            {info && (
                <div className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded">
                    {info}
                </div>
            )}

            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer mb-8 w-full max-w-lg"
            >
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p className="text-gray-600">松开文件即可上传...</p> :
                        <p className="text-gray-600">将 PCD 或 BIN 文件拖放到此处，或点击选择文件</p>
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
            <p className="mt-4 text-gray-600">此处将加载并显示点云数据（支持 .pcd / .bin，BIN 默认按 xyzi 解析）。</p>
        </div>
    );
}