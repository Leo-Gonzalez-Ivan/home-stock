import { useState, useEffect, useCallback } from 'react';
import { getProducts, getCategories, deleteProduct } from '../api/homeStockApi';
import ProductCard from '../components/ProductCard';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (selectedCat) params.categoryId = selectedCat;
    getProducts(params)
      .then(r => setProducts(r.data))
      .catch(() => setError('Error al cargar productos'))
      .finally(() => setLoading(false));
  }, [search, selectedCat]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto del inventario?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Error al eliminar el producto');
    }
  };

  const handleConsumed = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
        <span className="text-sm text-gray-500">{products.length} productos</span>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          className="input"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="select sm:w-48"
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={loadProducts} className="btn-secondary">🔄 Actualizar</button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Cargando inventario...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>No hay productos en el inventario</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onConsumed={handleConsumed}
              onDeleted={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
