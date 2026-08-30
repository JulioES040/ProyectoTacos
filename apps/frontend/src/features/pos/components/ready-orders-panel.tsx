'use client';

import {
  FiBell as BellRing,
  FiCheckCircle as CheckCheck,
  FiClock as Clock3,
  FiPackage as PackageCheck,
  FiX as X,
} from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import {
  deliverKitchenOrder,
  KitchenOrder,
  readKitchenOrders,
  subscribeToKitchenOrders,
} from '@/features/kitchen/services/kitchen-queue';

function minutesSince(createdAt: string, now: number) {
  return Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000));
}

export function ReadyOrdersPanel() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const readyOrders = orders.filter((order) => order.status === 'READY');

  useEffect(() => {
    const refresh = () => setOrders(readKitchenOrders());
    setNow(Date.now());
    refresh();
    const unsubscribe = subscribeToKitchenOrders(refresh);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  return (
    <div className="ready-orders-control">
      <button type="button" className={`ready-orders-trigger${readyOrders.length ? ' has-ready' : ''}`} onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} aria-haspopup="dialog">
        <BellRing size={18} />
        <span>Ordenes listas</span>
        <strong aria-live="polite">{readyOrders.length}</strong>
      </button>

      {isOpen && <div className="ready-orders-popover" role="dialog" aria-modal="false" aria-labelledby="ready-orders-title">
        <header><div><span>Entrega en caja</span><h2 id="ready-orders-title">Ordenes listas</h2></div><button ref={closeButtonRef} type="button" onClick={() => setIsOpen(false)} title="Cerrar" aria-label="Cerrar ordenes listas"><X size={21} /></button></header>
        <div className="ready-orders-list">
          {readyOrders.map((order) => <article className="ready-order" key={order.publicToken}>
            <div className="ready-order-heading"><div><span>Orden</span><strong>#{order.orderNumber}</strong></div><span><Clock3 size={16} /> {minutesSince(order.createdAt, now)} min</span></div>
            <h3>{order.customer}</h3>
            <ul>{order.lines.map((line) => <li key={line.id}><strong>{line.quantity}x</strong> {line.name}</li>)}</ul>
            <button type="button" onClick={() => deliverKitchenOrder(order.publicToken)}><PackageCheck size={20} /> Marcar como entregada</button>
          </article>)}
          {readyOrders.length === 0 && <div className="ready-orders-empty"><CheckCheck size={32} /><strong>Sin entregas pendientes</strong><p>Las ordenes apareceran aqui cuando cocina las marque como listas.</p></div>}
        </div>
      </div>}
    </div>
  );
}
