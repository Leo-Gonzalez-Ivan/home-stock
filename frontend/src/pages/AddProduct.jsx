import { useState, useEffect } from 'react';
import { createProduct, getCategories } from '../api/homeStockApi';
import { useNavigate } from 'react-router-dom';

export default function AddProduct({ prefill = null, onSaved = null }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: prefill?.name || '',
    brand: prefill?.brand || '',
    categoryId: prefill?.categoryId || '',
    unitType: prefill?.unitType || 'UNITS',
    quantity: prefill?.quantity || '',
    minQuantity: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) { setError('La cantidad debe ser mayor a 0'); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand || null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        unitType: form.unitType,
        quantity: qty,
        minQuantity: form.minQuantity ? parseFloat(form.minQuantity) : null,
      };
      await createProduct(payload);
      if (onSaved) {
        onSaved();
      } else {
        setSuccess('¡Producto agregado al inventario!');
        setForm({ name: '', brand: '', categoryId: '', unitType: 'UNITS', quantity: '', minQuantity: '' });
        setTimeout(() => navigate('/inventory'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Agregar producto</h2>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input name="name" className="input" value={form.name} onChange={handleChange}
              placeholder="Ej: Arroz largo fino" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <input name="brand" className="input" value={form.brand} onChange={handleChange}
              placeholder="Ej: La Preferida" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select name="categoryId" className="select" value={form.categoryId} onChange={handleChange}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
              <select name="unitType" className="select" value={form.unitType} onChange={handleChange}>
                <option value="UNITS">Unidades</option>
                <option value="GRAMS">Gramos (g)</option>
                <option value="MILLILITERS">Mililitros (ml)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input name="quantity" type="number" step="0.01" min="0.01" className="input"
                value={form.quantity} onChange={handleChange} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input name="minQuantity" type="number" step="0.01" min="0" className="input"
                value={form.minQuantity} onChange={handleChange} placeholder="Alerta" />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Guardando...' : '✅ Guardar producto'}
          </button>
        </form>
      </div>
    </div>
  );
}
