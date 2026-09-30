import { useState } from 'react';
import { consumeProduct } from '../api/homeStockApi';

const unitShort = (type) => ({ UNITS: 'u.', GRAMS: 'g', MILLILITERS: 'ml' }[type] || type);

export default function ConsumeModal({ product, onClose, onSuccess }) {
  const [mode, setMode] = useState('partial'); // 'partial' | 'all'
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'partial') {
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        setError('Ingresá una cantidad mayor a 0');
        return;
      }
      if (val > product.quantity) {
        setError(`No podés consumir más de ${product.quantity} ${unitShort(product.unitType)}`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = mode === 'all'
        ? { consumeAll: true }
        : { consumeAll: false, amount: parseFloat(amount) };
      const res = await consumeProduct(product.id, payload);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al consumir el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold">Consumir producto</h2>
              <p className="text-sm text-gray-500">{product.name}{product.brand ? ` — ${product.brand}` : ''}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Stock actual: </span>
            <span className="font-bold text-gray-900">{product.quantity} {unitShort(product.unitType)}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode selector */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('partial')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'partial'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cantidad parcial
              </button>
              <button
                type="button"
                onClick={() => setMode('all')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'all'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Todo el stock
              </button>
            </div>

            {mode === 'partial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad a consumir ({unitShort(product.unitType)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={product.quantity}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input"
                  placeholder={`Máx: ${product.quantity}`}
                  autoFocus
                />
              </div>
            )}

            {mode === 'all' && (
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                Se eliminará todo el stock: <strong>{product.quantity} {unitShort(product.unitType)}</strong>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                Cancelar
              </button>
              <button
                type="submit"
                className={mode === 'all' ? 'btn-danger flex-1' : 'btn-primary flex-1'}
                disabled={loading}
              >
                {loading ? 'Procesando...' : mode === 'all' ? 'Eliminar todo' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
