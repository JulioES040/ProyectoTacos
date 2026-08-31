'use client';

import { FiBell, FiCheck, FiCheckCircle, FiClock, FiCoffee, FiPackage, FiShoppingBag, FiVolume2, FiVolumeX, FiXCircle, FiZap } from 'react-icons/fi';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KitchenOrderStatus,
  readTrackingOrder,
  subscribeToTrackedOrder,
  TrackingOrder,
} from '@/features/kitchen/services/kitchen-queue';
import { TrackingKitchenScene } from './tracking-kitchen-scene';

type OrderTrackingProps = { token: string };

const stages: Array<{ status: KitchenOrderStatus; label: string; description: string }> = [
  { status: 'QUEUED', label: 'Orden recibida', description: 'Tu pedido esta en la fila de preparacion.' },
  { status: 'PREPARING', label: 'En preparacion', description: 'Cocina esta preparando tu pedido.' },
  { status: 'READY', label: 'Pedido listo', description: 'Acercate al mostrador para recibirlo.' },
  { status: 'DELIVERED', label: 'Entregado', description: 'Tu pedido ya fue entregado.' },
];

const statusPosition: Record<KitchenOrderStatus, number> = {
  QUEUED: 0,
  PREPARING: 1,
  READY: 2,
  DELIVERED: 3,
};

const statusContent: Record<KitchenOrderStatus, { eyebrow: string; title: string; message: string }> = {
  QUEUED: { eyebrow: 'Orden confirmada', title: 'Estamos por comenzar', message: 'Tu pedido esta en cola y sera preparado en orden de llegada.' },
  PREPARING: { eyebrow: 'En cocina', title: 'Preparando tu pedido', message: 'El equipo de cocina ya esta trabajando en tu orden.' },
  READY: { eyebrow: 'Pedido listo', title: 'Ya puedes recogerlo', message: 'Acercate al mostrador e indica tu numero de orden.' },
  DELIVERED: { eyebrow: 'Orden completada', title: 'Pedido entregado', message: 'Gracias por visitarnos. Esperamos verte pronto.' },
};

export function OrderTracking({ token }: OrderTrackingProps) {
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundError, setSoundError] = useState('');
  const previousStatus = useRef<KitchenOrderStatus | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);

  const playReadyChime = useCallback(() => {
    const context = audioContext.current;
    if (!context || context.state !== 'running') return;

    const startAt = context.currentTime;
    [659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startAt + index * 0.18);
      gain.gain.setValueAtTime(0.0001, startAt + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.18, startAt + index * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + index * 0.18 + 0.28);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startAt + index * 0.18);
      oscillator.stop(startAt + index * 0.18 + 0.3);
    });
  }, []);

  const toggleSound = async () => {
    if (soundEnabled) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      return;
    }

    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      await context.resume();
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      setSoundError('');
      playReadyChime();
    } catch {
      setSoundError('No fue posible activar el aviso sonoro en este dispositivo.');
    }
  };

  useEffect(() => {
    let active = true;
    void readTrackingOrder(token)
      .then((result) => {
        if (!active) return;
        previousStatus.current = result.status;
        setOrder(result);
      })
      .catch(() => { if (active) setOrder(null); })
      .finally(() => { if (active) setLoaded(true); });
    const unsubscribe = subscribeToTrackedOrder(token, (result) => {
      if (!active) return;
      const becameReady = result.status === 'READY' && previousStatus.current !== 'READY';
      previousStatus.current = result.status;
      setOrder(result);
      if (becameReady && soundEnabledRef.current) playReadyChime();
    });
    return () => {
      active = false;
      unsubscribe();
      audioContext.current?.close().catch(() => undefined);
      audioContext.current = null;
    };
  }, [playReadyChime, token]);

  const currentStage = order ? statusPosition[order.status] : 0;
  const content = order ? statusContent[order.status] : null;
  const receivedTime = useMemo(() => order ? new Date(order.createdAt) : null, [order]);

  if (!loaded) {
    return <main className="tracking-shell"><div className="tracking-loading"><span /><strong>Consultando tu pedido</strong></div></main>;
  }

  if (!order || !content) {
    return <main className="tracking-shell">
      <header className="tracking-brand"><span><Image src="/brands/el-buen-taco-logo.png" alt="" width={44} height={44} priority /></span><div><strong>El Buen Taco</strong><small>Seguimiento de pedido</small></div></header>
      <section className="tracking-not-found"><FiXCircle size={48} /><h1>No encontramos esta orden</h1><p>Verifica que el codigo QR corresponda a tu ticket o solicita ayuda en caja.</p><code>{token}</code></section>
    </main>;
  }

  return (
    <main className={`tracking-shell tracking-${order.status.toLowerCase()}`}>
      <header className="tracking-brand"><span><Image src="/brands/el-buen-taco-logo.png" alt="" width={44} height={44} priority /></span><div><strong>El Buen Taco</strong><small>Seguimiento de pedido</small></div><span className="tracking-live"><i /> En vivo</span></header>

      <section className="tracking-content">
        <div className="tracking-order-heading">
          <div><span>Seguimiento de orden</span><strong>#{order.orderNumber}</strong></div>
          <span className={`tracking-status-chip status-${order.status.toLowerCase()}`}>{content.eyebrow}</span>
        </div>

        {order.status === 'READY' && <section className="tracking-ready-alert" role="status" aria-live="assertive">
          <FiBell size={29} aria-hidden="true" />
          <div><strong>Tu orden esta lista</strong><span>Acercate al mostrador para recogerla.</span></div>
        </section>}

        <section className="tracking-current" aria-live="polite">
          <div className="tracking-current-icon">{order.status === 'READY' || order.status === 'DELIVERED' ? <FiCheckCircle size={42} /> : order.status === 'PREPARING' ? <FiZap size={42} /> : <FiClock size={42} />}</div>
          <TrackingKitchenScene status={order.status} />
          <span>{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.message}</p>
        </section>

        <div className="tracking-meta">
          <div>{order.orderType === 'dine-in' ? <FiCoffee size={22} /> : <FiShoppingBag size={22} />}<span><small>Tipo de orden</small><strong>{order.orderType === 'dine-in' ? 'Para comer aqui' : 'Para llevar'}</strong></span></div>
          <div><FiClock size={22} /><span><small>Orden recibida</small><strong>{receivedTime ? `${String(receivedTime.getHours()).padStart(2, '0')}:${String(receivedTime.getMinutes()).padStart(2, '0')}` : '--:--'}</strong></span></div>
        </div>

        <section className="tracking-progress" aria-label="Progreso del pedido">
          <h2>Estado del pedido</h2>
          <ol>
            {stages.map((stage, index) => {
              const completed = index < currentStage;
              const active = index === currentStage;
              return <li key={stage.status} className={`${completed ? 'completed' : ''}${active ? ' active' : ''}`}>
                <span className="tracking-step-icon">{completed ? <FiCheck size={18} /> : active ? <FiPackage size={18} /> : index + 1}</span>
                <div><strong>{stage.label}</strong><p>{stage.description}</p></div>
              </li>;
            })}
          </ol>
        </section>

        <section className="tracking-sound-control" aria-label="Aviso sonoro">
          <div><strong>Aviso sonoro</strong><span>Te avisaremos cuando tu pedido este listo.</span></div>
          <button type="button" aria-pressed={soundEnabled} onClick={() => void toggleSound()}>{soundEnabled ? <FiVolume2 size={20} /> : <FiVolumeX size={20} />}{soundEnabled ? 'Activado' : 'Activar'}</button>
        </section>
        {soundError && <p className="tracking-sound-error" role="alert">{soundError}</p>}

        <p className="tracking-note">Esta pantalla se actualiza automaticamente. No necesitas recargarla.</p>
      </section>
    </main>
  );
}
