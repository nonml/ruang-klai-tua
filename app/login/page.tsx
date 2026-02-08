'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebaseClient';
import { useState } from 'react';

export default function LoginPage() {
  const [msg, setMsg] = useState('');

  async function login() {
    setMsg('กำลังล็อกอิน...');
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(firebaseAuth, provider);
    const idToken = await cred.user.getIdToken();

    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      setMsg('ล็อกอินไม่สำเร็จ');
      return;
    }
    setMsg('ล็อกอินแล้ว ✅');
    window.location.href = '/';
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
      <p className="text-sm text-slate-700">ต้องล็อกอินก่อนเพื่อป้องกันสแปมและติดตามสถานะเคส</p>
      <button onClick={login} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
        เข้าสู่ระบบด้วย Google
      </button>
      {msg && <div className="text-xs text-slate-700">{msg}</div>}
    </div>
  );
}
