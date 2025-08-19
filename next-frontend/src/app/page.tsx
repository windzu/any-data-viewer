'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PrivacyAgreement from './components/PrivacyAgreement';

export default function Home() {
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  useEffect(() => {
    const agreementStatus = localStorage.getItem('privacyAgreement');
    if (agreementStatus === 'agreed') {
      setAgreedToPrivacy(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem('privacyAgreement', 'agreed');
    setAgreedToPrivacy(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <h1 className="text-5xl font-bold mb-8 text-gray-800">AnyDataViewer</h1>

      {!agreedToPrivacy ? (
        <PrivacyAgreement onAgree={handleAgree} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/upload" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-200 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              文件上传 <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              上传本地文件进行预览。
            </p>
          </Link>

          <Link href="/pcd-viewer" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-200 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              PCD 预览 <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              预览点云PCD文件。
            </p>
          </Link>

          <Link href="/pickle-viewer" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-200 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              Pickle 预览 <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              解析并预览Python Pickle文件。
            </p>
          </Link>
        </div>
      )}
    </main>
  );
}
