import { useState } from 'react';
import ConsumeModal from './ConsumeModal';

const unitLabel = (type) => ({ UNITS: 'unidades', GRAMS: 'gramos', MILLILITERS: 'ml' }[type] || type);
const unitShort = (type) => ({ UNITS: 'u.', GRAMS: 'g', MILLILITERS: 'ml' }[type] || type);

export default function ProductCard({ product, onConsumed, onDeleted }) {
  const [showModal, setShowModal] = useState(false);

  const isLow = product.minQuantity && product.quantity <= product.minQuantity;

  const categoryColors = {
    'Alimentos': 'bg-orange-100 text-orange-700',
    'Bebidas': 'bg-blue-100 text-blue-700',
    'Limpieza': 'bg-purple-100 text-purple-700',
    'Higiene personal': 'bg-pink-100 text-pink-700',
    'Lácteos': 'bg-yellow-100 text-yellow-700',
    'Congelados': 'bg-cyan-100 text-cyan-700',
    'Panadería': 'bg-amber-100 text-amber-700',
  };
  const catColor = product.category
    ? categoryColors[product.category.name] || 'bg-gray-100 text-gray-700'
    : 'bg-gray-100 text-gray-700';

  return (
    <>
      <div className={`card flex flex-col gap-3 relative ${
        isLow ? 'border-amber-300 bg-amber-50' : ''
      }`}>
        {isLow && (
          <span className="absolute top-3 right-3 text-amber-500 text-lg" title="Stock bajo">⚠️</span>
        )}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
          {product.brand && <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>}
        </div>

        {product.category && (
          <span className={`badge ${catColor} w-fit`}>{product.category.name}</span>
        )}

        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {Number(product.quantity).toLocaleString('es-AR')}
            </span>
            <span className="text-sm text-gray-500 ml-1">{unitShort(product.unitType)}</span>
          </div>
          {product.minQuantity && (
            <span className="text-xs text-gray-400">mín: {product.minQuantity} {unitShort(product.unitType)}</span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs py-1.5 px-3 flex-1"
          >
            Consumir
          </button>
          <button
            onClick={() => onDeleted && onDeleted(product.id)}
            className="btn-danger text-xs py-1.5 px-3"
          >
            🗑️
          </button>
        </div>
      </div>

      {showModal && (
        <ConsumeModal
          product={product}
          onClose={() => setShowModal(false)}
          onSuccess={(updated) => {
            setShowModal(false);
            onConsumed && onConsumed(updated);
          }}
        />
      )}
    </>
  );
}
