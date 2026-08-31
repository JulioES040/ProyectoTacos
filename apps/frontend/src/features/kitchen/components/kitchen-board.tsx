'use client';

import {
  FiCheck as Check,
  FiClock as Clock3,
  FiCoffee as UtensilsCrossed,
  FiPackage as PackageCheck,
  FiPlay as Play,
  FiRefreshCw as RefreshCw,
  FiShoppingBag as ShoppingBag,
  FiZap as Flame,
} from 'react-icons/fi';
import { MdKitchen as ChefHat } from 'react-icons/md';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import {
  deliverKitchenOrder,
  KitchenOrder,
  KitchenOrderStatus,
  readKitchenOrders,
  subscribeToKitchenOrders,
  updateKitchenOrderStatus,
} from '../services/kitchen-queue';

type KitchenView = Exclude<KitchenOrderStatus, 'DELIVERED'>;

const columns: Array<{ status: KitchenView; title: string; description: string }> = [
  { status: 'QUEUED', title: 'En cola', description: 'Orden FIFO' },
  { status: 'PREPARING', title: 'Preparando', description: 'En cocina' },
  { status: 'READY', title: 'Listas', description: 'Para entregar' },
];

function elapsedMinutes(createdAt: string, now: number) {
  return Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000));
}

function OrderCard({ order, isNext, now }: { order: KitchenOrder; isNext: boolean; now: number }) {
  const minutes = elapsedMinutes(order.createdAt, now);
  const delayed = minutes >= 10 && order.status !== 'READY';
  const itemCount = order.lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <article className={`kitchen-card kitchen-card-${order.status.toLowerCase()}${isNext ? ' kitchen-card-next' : ''}`}>
      <header className="kitchen-card-header">
        <div><span>Orden</span><h3>#{order.orderNumber}</h3></div>
        <div className={`kitchen-timer${delayed ? ' delayed' : ''}`}><Clock3 size={19} /><strong>{minutes} min</strong>{delayed && <span>Demorada</span>}</div>
      </header>

      <div className="kitchen-order-meta">
        <span>{order.orderType === 'dine-in' ? <UtensilsCrossed size={18} /> : <ShoppingBag size={18} />}{order.orderType === 'dine-in' ? 'Comer aqui' : 'Para llevar'}</span>
        <strong>{order.customer}</strong>
      </div>

      {isNext && <div className="fifo-marker"><Flame size={17} /> Siguiente por preparar</div>}

      <div className="kitchen-items" aria-label={`${itemCount} productos en la orden`}>
        {order.lines.map((line) => <div className="kitchen-item" key={line.id}><strong>{line.quantity}x</strong><div><h4>{line.name}</h4><p>{line.description}</p></div></div>)}
      </div>

      <footer className="kitchen-card-footer">
        <span>{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
        {order.status === 'QUEUED' && <button type="button" disabled={!isNext} onClick={() => void updateKitchenOrderStatus(order.id, 'PREPARING')}><Play size={20} /> {isNext ? 'Comenzar' : 'Espera FIFO'}</button>}
        {order.status === 'PREPARING' && <button type="button" onClick={() => void updateKitchenOrderStatus(order.id, 'READY')}><Check size={21} /> Marcar lista</button>}
        {order.status === 'READY' && <button type="button" onClick={() => void deliverKitchenOrder(order.id)}><PackageCheck size={21} /> Entregada</button>}
      </footer>
    </article>
  );
}

export function KitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<KitchenView>('QUEUED');

  const refresh = useCallback(async () => {
    try {
      setOrders(await readKitchenOrders());
    } catch {}
  }, []);

  useEffect(() => {
    setNow(Date.now());
    void refresh();
    const unsubscribe = subscribeToKitchenOrders(() => void refresh());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [refresh]);

  const fifoOrders = useMemo(() => [...orders].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)), [orders]);
  const activeOrders = fifoOrders.filter((order) => order.status !== 'DELIVERED');
  const nextQueuedToken = activeOrders.find((order) => order.status === 'QUEUED')?.publicToken;
  const counts = Object.fromEntries(columns.map(({ status }) => [status, activeOrders.filter((order) => order.status === status).length])) as Record<KitchenView, number>;
  const currentTime = now === null ? '--:--' : (() => {
    const date = new Date(now);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'p. m.' : 'a. m.'}`;
  })();

  return (
    <main className="kitchen-shell">
      <AppSidebar />
      <header className="kitchen-header">
        <div className="kitchen-brand"><span><ChefHat size={28} /></span><div><strong>El Taquero</strong><small>Panel de cocina</small></div></div>
        <div className="kitchen-summary"><strong>{activeOrders.length} ordenes activas</strong><time><Clock3 size={19} /> {currentTime}</time></div>
      </header>

      <section className="kitchen-toolbar">
        <div><h1>Ordenes de cocina</h1><p>Preparar en el orden de llegada indicado.</p></div>
        <button type="button" onClick={() => void refresh()}><RefreshCw size={20} /> Actualizar</button>
      </section>

      <nav className="kitchen-tabs" aria-label="Estados de las ordenes">
        {columns.map((column) => <button type="button" key={column.status} className={activeView === column.status ? 'active' : ''} onClick={() => setActiveView(column.status)}>{column.title}<strong>{counts[column.status]}</strong></button>)}
      </nav>

      <section className="kitchen-columns" aria-live="polite">
        {columns.map((column) => {
          const columnOrders = activeOrders.filter((order) => order.status === column.status);
          return <section className={`kitchen-column${activeView === column.status ? ' active' : ''}`} key={column.status} aria-labelledby={`column-${column.status}`}>
            <header><div><h2 id={`column-${column.status}`}>{column.title}</h2><p>{column.description}</p></div><strong>{columnOrders.length}</strong></header>
            <div className="kitchen-card-list">
              {columnOrders.map((order) => <OrderCard key={order.publicToken} order={order} isNext={order.publicToken === nextQueuedToken} now={now ?? 0} />)}
              {columnOrders.length === 0 && <div className="kitchen-empty"><Check size={28} /><strong>Todo al dia</strong><span>No hay ordenes en este estado.</span></div>}
            </div>
          </section>;
        })}
      </section>
    </main>
  );
}
