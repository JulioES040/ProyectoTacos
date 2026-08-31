'use client';

import { FiEye, FiEyeOff, FiLock, FiLogIn, FiMonitor, FiUser } from 'react-icons/fi';
import { MdKitchen } from 'react-icons/md';
import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from './auth-context';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [destination, setDestination] = useState<'pos' | 'kitchen'>('pos');
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      await refresh();
      router.replace(params.get('next')?.startsWith('/') ? params.get('next')! : destination === 'kitchen' ? '/kitchen' : '/pos');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible iniciar sesion.'); }
    finally { setSaving(false); }
  };

  return <main className="login-shell">
    <section className="login-brand-panel">
      <header><Image src="/brands/el-buen-taco-logo.png" alt="El Buen Taco" width={54} height={54} priority /><div><strong>El Buen Taco</strong><span>Sistema POS</span></div></header>
      <div className="login-welcome"><p>Bienvenido<br />de vuelta</p><span>Gestiona ordenes, cocina y ventas desde un solo lugar.</span></div>
      <footer><div><FiMonitor size={18} /><strong>Caja</strong><span>Acceso al punto de venta</span></div><div><MdKitchen size={19} /><strong>Cocina</strong><span>Acceso al panel de preparacion</span></div></footer>
    </section>
    <section className="login-access-panel">
      <form onSubmit={submit} className="login-form" noValidate>
        <header><h1>Iniciar sesion</h1><p>Ingresa tus credenciales para continuar</p></header>
        <div className="login-destination" role="group" aria-label="Destino al iniciar sesion"><button type="button" className={destination === 'pos' ? 'selected' : ''} onClick={() => setDestination('pos')}><FiMonitor size={17} /> Caja</button><button type="button" className={destination === 'kitchen' ? 'selected' : ''} onClick={() => setDestination('kitchen')}><MdKitchen size={18} /> Cocina</button></div>
        <label>Usuario<span className="login-input"><FiUser size={18} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" required /></span></label>
        <label>Contrasena<span className="login-input"><FiLock size={18} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contrasena" minLength={8} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'} title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}>{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button></span></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit" disabled={saving}><FiLogIn size={20} />{saving ? 'Ingresando...' : 'Entrar al sistema'}</button>
        <small><FiLock size={14} /> Sesion segura</small>
      </form>
    </section>
  </main>;
}
