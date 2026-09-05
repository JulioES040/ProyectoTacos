'use client';

import { FiCheck, FiEdit2, FiPackage, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { createProduct, deleteProduct, Product, ProductInput, readProducts, subscribeToProducts, updateProduct } from '../services/menu-api';

const emptyForm: ProductInput = { name: '', description: '', price: 0, category: '', available: true };
const money = (value: number) => `Q${value.toFixed(2)}`;

export function MenuManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try { setProducts(await readProducts()); setError(''); }
    catch { setError('No fue posible cargar el menu. Verifica la conexion con el servidor.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToProducts(() => void refresh());
  }, [refresh]);

  const categories = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products]);
  const visible = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Todos' || product.category === category;
    const term = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return matchesCategory && term.includes(query.trim().toLowerCase());
  }), [products, query, category]);

  const startNew = () => { setEditingId(null); setForm(emptyForm); setError(''); setNotice(''); };
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({ name: product.name, description: product.description, price: product.price, category: product.category, available: product.available });
    setError(''); setNotice('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        setNotice('Producto actualizado correctamente.');
      } else {
        await createProduct(form);
        setNotice('Producto agregado al POS.');
      }
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar el producto.');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await deleteProduct(id); setDeleteId(null); setNotice('Producto eliminado del menu.'); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible eliminar el producto.'); }
  };

  const toggleAvailability = async (product: Product) => {
    try { await updateProduct(product.id, { available: !product.available }); await refresh(); }
    catch { setError('No fue posible cambiar la disponibilidad.'); }
  };

  return <main className="menu-shell">
    <AppSidebar />
    <header className="menu-header">
      <div><span className="menu-header-icon"><Image src="/brands/el-buen-taco-logo.png" alt="" width={48} height={48} priority /></span><div><strong>El Buen Taco</strong><small>Control de menu</small></div></div>
      <button type="button" onClick={startNew}><FiPlus size={20} /> Nuevo producto</button>
    </header>

    <section className="menu-overview">
      <div><span>Productos</span><strong>{products.length}</strong></div>
      <div><span>Disponibles</span><strong>{products.filter((product) => product.available).length}</strong></div>
      <div><span>Agotados</span><strong>{products.filter((product) => !product.available).length}</strong></div>
      <div><span>Categorias</span><strong>{categories.length}</strong></div>
    </section>

    <section className="menu-workspace">
      <section className="menu-catalog" aria-labelledby="menu-title">
        <div className="menu-title"><div><h1 id="menu-title">Platillos y bebidas</h1><p>Los cambios se reflejan automaticamente en el POS.</p></div><button type="button" onClick={() => void refresh()} title="Actualizar menu" aria-label="Actualizar menu"><FiRefreshCw size={19} /></button></div>
        <div className="menu-filters">
          <label><FiSearch size={18} /><span className="sr-only">Buscar en el menu</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria"><option>Todos</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        {error && <p className="menu-message error" role="alert">{error}</p>}
        {notice && <p className="menu-message success" role="status">{notice}</p>}
        <div className="menu-list" aria-live="polite">
          {loading ? <div className="menu-empty"><FiRefreshCw size={28} /><strong>Cargando menu</strong></div> : visible.map((product) => <article className="menu-product" key={product.id}>
            <span className="menu-product-icon"><FiPackage size={23} /></span>
            <div className="menu-product-copy"><div><h2>{product.name}</h2><span className={product.available ? 'available' : 'unavailable'}>{product.available ? 'Disponible' : 'Agotado'}</span></div><p>{product.description}</p><small>{product.category}</small></div>
            <strong className="menu-product-price">{money(product.price)}</strong>
            <div className="menu-product-actions">
              <button type="button" className="availability-toggle" aria-pressed={product.available} onClick={() => void toggleAvailability(product)}><span /> {product.available ? 'En venta' : 'Oculto'}</button>
              <button type="button" onClick={() => startEdit(product)} title={`Editar ${product.name}`} aria-label={`Editar ${product.name}`}><FiEdit2 size={18} /></button>
              <button type="button" className="delete" onClick={() => setDeleteId(product.id)} title={`Eliminar ${product.name}`} aria-label={`Eliminar ${product.name}`}><FiTrash2 size={18} /></button>
            </div>
            {deleteId === product.id && <div className="menu-delete-confirm"><span>Eliminar <strong>{product.name}</strong> del POS?</span><button type="button" onClick={() => void remove(product.id)}><FiCheck /> Eliminar</button><button type="button" onClick={() => setDeleteId(null)}><FiX /> Cancelar</button></div>}
          </article>)}
          {!loading && visible.length === 0 && <div className="menu-empty"><FiPackage size={30} /><strong>No hay productos</strong><span>Ajusta los filtros o crea un producto nuevo.</span></div>}
        </div>
      </section>

      <aside className="menu-editor" aria-labelledby="editor-title">
        <header><div><span>{editingId ? 'Editar producto' : 'Nuevo producto'}</span><h2 id="editor-title">{editingId ? form.name || 'Producto' : 'Agregar al menu'}</h2></div>{editingId && <button type="button" onClick={startNew} title="Cancelar edicion" aria-label="Cancelar edicion"><FiX size={20} /></button>}</header>
        <form onSubmit={submit}>
          <label>Nombre<input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Taco de birria" /></label>
          <label>Descripcion<textarea required maxLength={160} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Ingredientes o preparacion" /></label>
          <div className="menu-form-row"><label>Precio (Q)<input required min="0" step="0.01" type="number" value={form.price || ''} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label><label>Categoria<input required list="menu-categories" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Ej. Tacos" /><datalist id="menu-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist></label></div>
          <label className="menu-available"><input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} /><span><strong>Disponible en POS</strong><small>El cajero podra agregarlo a una orden.</small></span></label>
          <button className="menu-save" type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}</button>
        </form>
      </aside>
    </section>
  </main>;
}
