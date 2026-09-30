import { useState, useEffect } from 'react';
import { getProducts, getLowStock, getRecentMovements } from '../api/homeStockApi';
import LowStockAlert from '../components/LowStockAlert';
import { Link } from 'react-router-dom';

const unitShort = (t) => ({ UNITS: 'u.', GRAMS: 'g', MILLILITERS: 'ml' }[t] || t);

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, categories: 0, lowStock: 0 });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getLowStock(), getRecentMovements()])
      .then(([productsRes, lowRes, movRes]) => {
        const products = productsRes.data;
        const uniqueCats = new Set(products.filter(p => p.category).map(p => p.category.id));
        setStats({
          total: products.length,
          categories: uniqueCats.size,
          lowStock: lowRes.data.length,
        });
        setLowStockProducts(lowRes.data);
        setMovements(movRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="📦" label="Productos totales" value={stats.total} color="blue" />
        <StatCard icon="🗂️" label="Categorías" value={stats.categories} color="purple" />
        <StatCard icon="⚠️" label="Stock bajo" value={stats.lowStock} color="amber" />
      </div>

      {/* Low stock alert */}
      <LowStockAlert products={lowStockProducts} />

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/scan" className="btn-primary">📷 Escanear ticket</Link>
          <Link to="/add" className="btn-secondary">➕ Agregar producto</Link>
          <Link to="/inventory" className="btn-secondary">📦 Ver inventario</Link>
        </div>
      </div>

      {/* Recent movements */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Últimos movimientos</h3>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-500">No hay movimientos aún</p>
        ) : (
          <div className="space-y-2">
            {movements.slice(0, 10).map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{m.movementType === 'IN' ? '🟢' : '🔴'}</span>
                  <span className="text-gray-700">{m.product?.name || 'Producto'}</span>
                  <span className="text-gray-400 text-xs">— {m.reason}</span>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${
                    m.movementType === 'IN' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {m.movementType === 'IN' ? '+' : '-'}{m.quantity} {unitShort(m.product?.unitType)}
                  </span>
                  <div className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString('es-AR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    amber: 'bg-amber-50 border-amber-100',
  };
  return (
    <div className={`card ${colors[color]} flex items-center gap-4`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
}
