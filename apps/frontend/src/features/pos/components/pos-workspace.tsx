'use client';

import {
  FiCheckCircle as CheckCircle2,
  FiClock as Clock3,
  FiMinus as Minus,
  FiPackage as PackageOpen,
  FiPlus as Plus,
  FiSave as Save,
  FiSearch as Search,
  FiSettings as Settings,
  FiShoppingBag as ShoppingBag,
  FiTrash2 as Trash2,
  FiZap as Flame,
} from 'react-icons/fi';
import { GiCheeseWedge, GiKnifeFork, GiTacos, GiWaterBottle } from 'react-icons/gi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createKitchenOrder } from '@/features/kitchen/services/kitchen-queue';
import { readProducts, subscribeToProducts } from '@/features/menu/services/menu-api';
import { AppSidebar } from '@/components/app-sidebar';
import { OrderTicket, OrderTicketDialog } from './order-ticket-dialog';
import { ReadyOrdersPanel } from './ready-orders-panel';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon?: string;
  available?: boolean;
};

const initialProducts: Product[] = [
  { id: 'pastor', name: 'Taco al pastor', description: 'Pastor marinado', price: 38, category: 'Tacos clasicos', icon: '🌮' },
  { id: 'carnitas', name: 'Taco carnitas', description: 'Carnitas de cerdo', price: 38, category: 'Tacos clasicos', icon: '🌮' },
  { id: 'pibil', name: 'Taco pollo pibil', description: 'Pollo achiote', price: 38, category: 'Tacos clasicos', icon: '🌮' },
  { id: 'cachete', name: 'Taco cachete', description: 'Cachete res', price: 38, category: 'Tacos clasicos', icon: '🌮' },
  { id: 'culotte', name: 'Taco culotte', description: 'Culotte premium', price: 50, category: 'Tacos premium', icon: '🥩' },
  { id: 'camaron', name: 'Taco camaron', description: 'Camaron al ajo', price: 50, category: 'Tacos premium', icon: '🦐' },
  { id: 'pulpo', name: 'Taco pulpo', description: 'Pulpo a las brasas', price: 50, category: 'Tacos premium', icon: '🐙', available: false },
  { id: 'lengua', name: 'Taco lengua', description: 'Lengua de res', price: 50, category: 'Tacos premium', icon: '🌮' },
  { id: 'gringa-pastor', name: 'Gringa al pastor', description: 'Pastor + queso', price: 40, category: 'Gringas clasicas', icon: '🫓' },
  { id: 'gringa-carnitas', name: 'Gringa carnitas', description: 'Carnitas + queso', price: 40, category: 'Gringas clasicas', icon: '🫓' },
  { id: 'gringa-pibil', name: 'Gringa pollo pibil', description: 'Pollo + queso Oax.', price: 40, category: 'Gringas clasicas', icon: '🫓' },
  { id: 'gringa-culotte', name: 'Gringa culotte', description: 'Culotte + queso', price: 55, category: 'Gringas premium', icon: '🥩' },
  { id: 'birria', name: 'Taquesos de birria', description: 'Birria + queso', price: 48, category: 'Taquesos', icon: '🫔' },
  { id: 'agua', name: 'Agua fresca', description: 'Jamaica, horchata o limon', price: 18, category: 'Bebidas', icon: '🥤' },
];

type Cart = Record<string, number>;
const money = (value: number) => `Q${value.toFixed(2)}`;

function ProductVisual({ category }: { category: string }) {
  if (category.startsWith('Tacos')) return <GiTacos size={28} />;
  if (category.startsWith('Gringas')) return <span className="tortilla-icon" aria-hidden="true" />;
  if (category === 'Bebidas') return <GiWaterBottle size={27} />;
  return <GiCheeseWedge size={26} />;
}

export function PosWorkspace() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [catalogError, setCatalogError] = useState('');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Cart>({});
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [customer, setCustomer] = useState('');
  const [ticket, setTicket] = useState<OrderTicket | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeError, setChargeError] = useState('');
  const idempotencyKey = useRef<string | null>(null);

  const refreshProducts = useCallback(async () => {
    try { setProducts(await readProducts()); setCatalogError(''); }
    catch { setCatalogError('No fue posible cargar el menu.'); }
  }, []);

  useEffect(() => {
    void refreshProducts();
    return subscribeToProducts(() => void refreshProducts());
  }, [refreshProducts]);

  const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => product.category))], [products]);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchCategory = activeCategory === 'Todos' || product.category === activeCategory;
    const terms = `${product.name} ${product.description}`.toLowerCase();
    return matchCategory && terms.includes(query.toLowerCase().trim());
  }), [activeCategory, query]);

  const cartLines = products.flatMap((product) => cart[product.id] ? [{ product, quantity: cart[product.id] }] : []);
  const subtotal = cartLines.reduce((total, line) => total + line.product.price * line.quantity, 0);

  const changeQuantity = (productId: string, amount: number) => {
    setTicket(null);
    setChargeError('');
    idempotencyKey.current = null;
    setCart((current) => {
      const nextQuantity = (current[productId] ?? 0) + amount;
      if (nextQuantity <= 0) {
        const { [productId]: _, ...rest } = current;
        return rest;
      }
      return { ...current, [productId]: nextQuantity };
    });
  };

  const cancelOrder = () => {
    setCart({});
    setCustomer('');
    setOrderType('dine-in');
    setTicket(null);
    setChargeError('');
    idempotencyKey.current = null;
  };

  const chargeOrder = async () => {
    if (subtotal === 0) return;
    if (ticket) { setIsTicketOpen(true); return; }
    setIsCharging(true);
    setChargeError('');
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const order = await createKitchenOrder({
        customer: customer.trim() || 'Cliente mostrador',
        orderType,
        items: cartLines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      }, idempotencyKey.current);
      const currentTicket: OrderTicket = {
        orderNumber: order.orderNumber,
        publicToken: order.publicToken,
        customer: order.customer,
        orderType: order.orderType,
        createdAt: order.createdAt,
        lines: order.lines.map((line) => ({ id: line.id, name: line.name, description: line.description, price: line.unitPrice, quantity: line.quantity })),
        total: order.total,
        trackingUrl: new URL(`/track/${order.publicToken}`, process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).toString(),
      };
      setTicket(currentTicket);
      setIsTicketOpen(true);
    } catch (error) {
      setChargeError(error instanceof Error ? error.message : 'No fue posible registrar la orden.');
    } finally {
      setIsCharging(false);
    }
  };

  const startNewOrder = () => {
    cancelOrder();
    setIsTicketOpen(false);
  };

  return (
    <main className="pos-shell">
      <AppSidebar />
      <header className="pos-header">
        <div className="pos-context"><span className="brand-mark"><Flame size={21} /></span><span><strong>El Taquero</strong><small>Punto de venta</small></span></div>
        <label className="product-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Buscar producto</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." />
        </label>
        <div className="header-actions">
          <ReadyOrdersPanel />
          <span className="clock"><Clock3 size={17} /> 10:49 p. m.</span>
          <button className="icon-button" type="button" title="Configuracion" aria-label="Configuracion"><Settings size={19} /></button>
        </div>
      </header>

      <section className="pos-content" aria-label="Punto de venta">
        <section className="catalog" aria-label="Catalogo de productos">
          <nav className="category-tabs" aria-label="Categorias de productos">
            {categories.map((category) => <button key={category} type="button" className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}
          </nav>
          <div className="product-grid" aria-live="polite">
            {visibleProducts.map((product) => {
              const unavailable = product.available === false;
              return <article className={`product-card${unavailable ? ' unavailable' : ''}`} key={product.id}>
                <div className="product-card-top"><span className="product-icon" aria-hidden="true"><ProductVisual category={product.category} /></span>{unavailable && <span className="sold-out">Agotado</span>}</div>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <div className="product-card-bottom"><strong>{money(product.price)}</strong><button type="button" title={`Agregar ${product.name}`} aria-label={`Agregar ${product.name}`} disabled={unavailable} onClick={() => changeQuantity(product.id, 1)}><Plus size={18} /></button></div>
              </article>;
            })}
          </div>
          {catalogError && <div className="catalog-empty"><PackageOpen size={32} /><p>{catalogError}</p><button type="button" onClick={() => void refreshProducts()}>Reintentar</button></div>}
          {visibleProducts.length === 0 && <div className="catalog-empty"><PackageOpen size={32} /><p>No hay productos que coincidan con la busqueda.</p></div>}
        </section>

        <aside className="order-panel" aria-label="Orden actual">
          <div className="order-heading"><div><span>Orden actual</span><h1>{ticket ? `#${ticket.orderNumber}` : 'Nueva'}</h1></div><span className="order-active"><CheckCircle2 size={15} /> Activa</span></div>
          <label className="customer-input"><span className="sr-only">Nombre del cliente</span><input value={customer} onChange={(event) => { setCustomer(event.target.value); setTicket(null); setChargeError(''); idempotencyKey.current = null; }} placeholder="Nombre del cliente (opcional)" /></label>
          <div className="order-mode" role="group" aria-label="Tipo de orden">
            <button type="button" className={orderType === 'dine-in' ? 'selected' : ''} onClick={() => { setOrderType('dine-in'); setTicket(null); setChargeError(''); idempotencyKey.current = null; }}><GiKnifeFork size={17} /> Para comer aqui</button>
            <button type="button" className={orderType === 'takeaway' ? 'selected' : ''} onClick={() => { setOrderType('takeaway'); setTicket(null); setChargeError(''); idempotencyKey.current = null; }}><ShoppingBag size={17} /> Para llevar</button>
          </div>
          <div className="order-lines">
            {cartLines.length === 0 ? <div className="empty-order"><GiTacos size={42} aria-hidden="true" /><h2>Selecciona productos</h2><p>para comenzar la orden</p></div> : cartLines.map(({ product, quantity }) => <div className="order-line" key={product.id}><div><strong>{product.name}</strong><small>{money(product.price)} c/u</small></div><div className="line-controls"><button type="button" title={`Restar ${product.name}`} aria-label={`Restar ${product.name}`} onClick={() => changeQuantity(product.id, -1)}><Minus size={15} /></button><span>{quantity}</span><button type="button" title={`Sumar ${product.name}`} aria-label={`Sumar ${product.name}`} onClick={() => changeQuantity(product.id, 1)}><Plus size={15} /></button></div><strong>{money(product.price * quantity)}</strong></div>)}
          </div>
          <div className="order-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Descuento</span><strong className="discount">-</strong></div><div className="total"><span>Total</span><strong>{money(subtotal)}</strong></div></div>
          <div className="order-actions">{chargeError && <p className="charge-error" role="alert">{chargeError}</p>}<button className="charge-button" type="button" disabled={subtotal === 0 || isCharging} onClick={chargeOrder}>{isCharging ? 'Registrando...' : `Cobrar ${money(subtotal)}`}</button><div><button type="button" disabled={subtotal === 0}><Save size={16} /> Guardar orden</button><button type="button" className="cancel-button" disabled={subtotal === 0 || isCharging} onClick={cancelOrder}><Trash2 size={16} /> Cancelar</button></div></div>
        </aside>
      </section>
      {ticket && isTicketOpen && <OrderTicketDialog ticket={ticket} onClose={() => setIsTicketOpen(false)} onNewOrder={startNewOrder} />}
    </main>
  );
}
