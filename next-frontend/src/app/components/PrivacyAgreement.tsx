'use client';

interface PrivacyAgreementProps {
    onAgree: () => void;
}

export default function PrivacyAgreement({ onAgree }: PrivacyAgreementProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">隐私协议</h2>
            <p className="text-gray-700 mb-6">
                为了提供文件预览服务，我们可能需要处理您上传的文件数据。我们承诺保护您的隐私，不会存储或分享您的文件内容。
                您上传的文件将仅用于即时预览处理，不会在服务器上长期保留。请您确认已阅读并同意本隐私协议。
            </p>
            <button
                onClick={onAgree}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 ease-in-out"
            >
                我同意并继续
            </button>
        </div>
    );
} 