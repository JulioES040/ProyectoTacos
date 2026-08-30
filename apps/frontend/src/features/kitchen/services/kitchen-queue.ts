export type KitchenOrderStatus = 'QUEUED' | 'PREPARING' | 'READY';

export type KitchenOrderLine = {
  id: string;
  name: string;
  description: string;
  quantity: number;
};

export type KitchenOrder = {
  orderNumber: string;
  publicToken: string;
  customer: string;
  orderType: 'dine-in' | 'takeaway';
  createdAt: string;
  lines: KitchenOrderLine[];
  status: KitchenOrderStatus;
};

const STORAGE_KEY = 'el-taquero:kitchen-orders';
const CHANGE_EVENT = 'el-taquero:kitchen-orders-changed';

const demoOrders: KitchenOrder[] = [
  {
    orderNumber: '5605',
    publicToken: 'ET-DEMO-5605',
    customer: 'Mesa 4',
    orderType: 'dine-in',
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    status: 'PREPARING',
    lines: [
      { id: 'pastor', name: 'Taco al pastor', description: 'Pastor marinado', quantity: 3 },
      { id: 'agua', name: 'Agua fresca', description: 'Horchata', quantity: 2 },
    ],
  },
  {
    orderNumber: '5606',
    publicToken: 'ET-DEMO-5606',
    customer: 'Carlos M.',
    orderType: 'takeaway',
    createdAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    status: 'QUEUED',
    lines: [
      { id: 'carnitas', name: 'Taco carnitas', description: 'Sin cebolla', quantity: 4 },
      { id: 'gringa-pastor', name: 'Gringa al pastor', description: 'Extra queso', quantity: 1 },
    ],
  },
  {
    orderNumber: '5607',
    publicToken: 'ET-DEMO-5607',
    customer: 'Mesa 2',
    orderType: 'dine-in',
    createdAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    status: 'QUEUED',
    lines: [
      { id: 'pibil', name: 'Taco pollo pibil', description: 'Preparacion normal', quantity: 2 },
      { id: 'birria', name: 'Taquesos de birria', description: 'Con consome', quantity: 2 },
    ],
  },
];

const sortFifo = (orders: KitchenOrder[]) => [...orders].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

export function readKitchenOrders(): KitchenOrder[] {
  if (typeof window === 'undefined') return demoOrders;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoOrders));
    return demoOrders;
  }

  try {
    return sortFifo(JSON.parse(stored) as KitchenOrder[]);
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoOrders));
    return demoOrders;
  }
}

function writeKitchenOrders(orders: KitchenOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortFifo(orders)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function enqueueKitchenOrder(order: Omit<KitchenOrder, 'status'>) {
  const orders = readKitchenOrders();
  if (orders.some((current) => current.publicToken === order.publicToken)) return;
  writeKitchenOrders([...orders, { ...order, status: 'QUEUED' }]);
}

export function updateKitchenOrderStatus(publicToken: string, status: KitchenOrderStatus) {
  writeKitchenOrders(readKitchenOrders().map((order) => order.publicToken === publicToken ? { ...order, status } : order));
}

export function deliverKitchenOrder(publicToken: string) {
  writeKitchenOrders(readKitchenOrders().filter((order) => order.publicToken !== publicToken));
}

export function subscribeToKitchenOrders(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}
