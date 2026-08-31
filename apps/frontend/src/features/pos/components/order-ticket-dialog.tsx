'use client';

import {
  FiCheckCircle as CheckCircle2,
  FiPrinter as Printer,
  FiRotateCcw as RotateCcw,
  FiX as X,
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export type TicketLine = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  extras: Array<{ id: string; name: string; price: number }>;
};

export type OrderTicket = {
  orderNumber: string;
  publicToken: string;
  customer: string;
  orderType: 'dine-in' | 'takeaway';
  createdAt: string;
  lines: TicketLine[];
  total: number;
  trackingUrl: string;
};

type OrderTicketDialogProps = {
  ticket: OrderTicket;
  onClose: () => void;
  onNewOrder: () => void;
};

const money = (value: number) => `Q${value.toFixed(2)}`;

export function OrderTicketDialog({ ticket, onClose, onNewOrder }: OrderTicketDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('ticket-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('ticket-open');
      previousFocus?.focus();
    };
  }, [onClose]);

  const date = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ticket.createdAt));

  return (
    <div className="ticket-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="ticket-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ticket-title">
        <header className="ticket-dialog-header">
          <div>
            <span className="ticket-kicker">Cobro completado</span>
            <h2 id="ticket-title">Ticket de la orden</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="ticket-close" onClick={onClose} title="Cerrar ticket" aria-label="Cerrar ticket"><X size={24} /></button>
        </header>

        <div className="ticket-paper">
          <div className="ticket-brand"><div><Image src="/brands/el-buen-taco-logo.png" alt="Logo El Buen Taco" width={44} height={44} /><strong>El Buen Taco</strong></div><span>Punto de venta</span></div>
          <section className="ticket-identity" aria-label="Datos de la orden">
            <div><span>Orden</span><strong>#{ticket.orderNumber}</strong></div>
            <span className="ticket-paid"><CheckCircle2 size={20} /> Pago registrado</span>
          </section>
          <div className="ticket-meta">
            <div><span>Cliente</span><strong>{ticket.customer}</strong></div>
            <div><span>Tipo de orden</span><strong>{ticket.orderType === 'dine-in' ? 'Para comer aqui' : 'Para llevar'}</strong></div>
            <div><span>Fecha y hora</span><strong>{date}</strong></div>
          </div>

          <section className="ticket-products" aria-labelledby="ticket-products-title">
            <h3 id="ticket-products-title">Detalle de productos</h3>
            <div className="ticket-table-heading" aria-hidden="true"><span>Cant.</span><span>Producto</span><span>Importe</span></div>
            {ticket.lines.map((line) => (
              <div className="ticket-product" key={line.id}>
                <strong className="ticket-quantity">{line.quantity}x</strong>
                <div><strong>{line.name}</strong><span>{line.description} · {money(line.price)} c/u</span></div>
                <strong>{money((line.price + line.extras.reduce((total, extra) => total + extra.price, 0)) * line.quantity)}</strong>
              </div>
            ))}
          </section>

          <div className="ticket-total"><span>Total pagado</span><strong>{money(ticket.total)}</strong></div>

          <section className="ticket-tracking" aria-label="Codigo QR de seguimiento">
            <div className="ticket-qr"><QRCodeSVG value={ticket.trackingUrl} size={156} level="M" marginSize={1} title={`Seguimiento de la orden ${ticket.orderNumber}`} /></div>
            <div><h3>Consulta tu orden</h3><p>Escanea este codigo QR para ver el estado de preparacion.</p><strong>Codigo: {ticket.publicToken}</strong></div>
          </section>
        </div>

        <footer className="ticket-dialog-actions">
          <button type="button" className="ticket-print" onClick={() => window.print()}><Printer size={20} /> Imprimir ticket</button>
          <button type="button" className="ticket-new-order" onClick={onNewOrder}><RotateCcw size={20} /> Nueva orden</button>
        </footer>
      </div>
    </div>
  );
}
