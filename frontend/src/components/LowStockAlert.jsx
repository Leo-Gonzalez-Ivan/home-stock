export default function LowStockAlert({ products }) {
  if (!products || products.length === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">⚠️</span>
        <h3 className="font-semibold text-amber-800">Stock bajo ({products.length} productos)</h3>
      </div>
      <ul className="space-y-1">
        {products.map(p => (
          <li key={p.id} className="text-sm text-amber-700 flex justify-between">
            <span>{p.name} {p.brand ? `(${p.brand})` : ''}</span>
            <span className="font-semibold">{p.quantity} {unitLabel(p.unitType)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function unitLabel(type) {
  const labels = { UNITS: 'u.', GRAMS: 'g', MILLILITERS: 'ml' };
  return labels[type] || type;
}
