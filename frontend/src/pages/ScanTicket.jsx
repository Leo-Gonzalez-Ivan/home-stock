import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { scanQr, processTicket, getCategories } from '../api/homeStockApi';
import { useNavigate } from 'react-router-dom';

const unitOptions = [
  { value: 'UNITS', label: 'Unidades' },
  { value: 'GRAMS', label: 'Gramos (g)' },
  { value: 'MILLILITERS', label: 'Mililitros (ml)' },
];

export default function ScanTicket() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null); // raw QR string
  const [ticketDTO, setTicketDTO] = useState(null);     // parsed DTO from backend
  const [items, setItems] = useState([]);               // editable items
  const [categories, setCategories] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('scan'); // 'scan' | 'edit' | 'done'

  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(console.error);
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verificá los permisos.');
    }
  };

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code) {
      stopCamera();
      handleQrDetected(code.data);
    } else {
      animRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const handleQrDetected = async (qrData) => {
    setScannedData(qrData);
    setLoading(true);
    setError('');
    try {
      const res = await scanQr(qrData);
      const dto = res.data;
      setTicketDTO(dto);
      setStoreName(dto.storeName || '');
      // If items were parsed, use them; otherwise start with one empty item
      if (dto.items && dto.items.length > 0) {
        setItems(dto.items.map((it, i) => ({ ...it, _key: i })));
      } else {
        setItems([emptyItem(0)]);
      }
      setStep('edit');
    } catch {
      setError('Error al procesar el QR. Podés agregar los productos manualmente.');
      setItems([emptyItem(0)]);
      setStep('edit');
    } finally {
      setLoading(false);
    }
  };

  const emptyItem = (key) => ({
    _key: key,
    productName: '',
    brand: '',
    categoryId: '',
    unitType: 'UNITS',
    quantity: '',
  });

  const addItem = () => {
    setItems(prev => [...prev, emptyItem(Date.now())]);
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(it => it._key !== key));
  };

  const updateItem = (key, field, value) => {
    setItems(prev => prev.map(it => it._key === key ? { ...it, [field]: value } : it));
  };

  const handleManual = () => {
    setScannedData(null);
    setItems([emptyItem(0)]);
    setStoreName('');
    setStep('edit');
  };

  const handleSubmit = async () => {
    setError('');
    const validItems = items.filter(it => it.productName.trim() && parseFloat(it.quantity) > 0);
    if (validItems.length === 0) {
      setError('Agregá al menos un producto con nombre y cantidad mayor a 0');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        rawQrData: scannedData || null,
        storeName: storeName || null,
        items: validItems.map(it => ({
          productName: it.productName.trim(),
          brand: it.brand || null,
          categoryId: it.categoryId ? Number(it.categoryId) : null,
          unitType: it.unitType,
          quantity: parseFloat(it.quantity),
        })),
      };
      await processTicket(payload);
      setStep('done');
      setSuccess(`¡Ticket procesado! ${validItems.length} producto(s) actualizados.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el ticket');
    } finally {
      setLoading(false);
    }
  };

  // STEP: SCAN
  if (step === 'scan') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Escanear ticket</h2>

        <div className="card space-y-4">
          <p className="text-sm text-gray-600">
            Apuntá la cámara al código QR de tu ticket de supermercado.
            Si no tenés QR, podés cargar los productos manualmente.
          </p>

          {/* Camera area */}
          <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{aspectRatio:'4/3'}}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-sm opacity-75">Presioná para activar la cámara</p>
                </div>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-green-400 rounded-xl opacity-70" />
              </div>
            )}
          </div>

          {loading && <div className="text-center text-sm text-gray-500">Procesando QR...</div>}
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3">
            {!scanning ? (
              <button onClick={startCamera} className="btn-primary flex-1">
                📷 Activar cámara
              </button>
            ) : (
              <button onClick={stopCamera} className="btn-secondary flex-1">
                ⏹ Detener
              </button>
            )}
            <button onClick={handleManual} className="btn-secondary flex-1">
              ✏️ Carga manual
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP: DONE
  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h3 className="text-xl font-bold text-gray-900">¡Ticket procesado!</h3>
          <p className="text-gray-600">{success}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/inventory')} className="btn-primary">Ver inventario</button>
            <button onClick={() => { setStep('scan'); setScannedData(null); setItems([]); setSuccess(''); }}
              className="btn-secondary">Escanear otro</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP: EDIT
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Revisar productos</h2>
        <button onClick={() => setStep('scan')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver
        </button>
      </div>

      {scannedData && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✅ QR detectado: <span className="font-mono text-xs break-all">{scannedData.slice(0, 80)}...</span>
        </div>
      )}

      {/* Store name */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del local (opcional)</label>
        <input className="input" value={storeName} onChange={e => setStoreName(e.target.value)}
          placeholder="Ej: Carrefour, Coto, Día..." />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item._key} className="card space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">Producto #{index + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(item._key)} className="text-red-400 hover:text-red-600 text-sm">
                  Eliminar
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                <input className="input" value={item.productName}
                  onChange={e => updateItem(item._key, 'productName', e.target.value)}
                  placeholder="Ej: Leche entera" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Marca</label>
                <input className="input" value={item.brand}
                  onChange={e => updateItem(item._key, 'brand', e.target.value)}
                  placeholder="Ej: Sancor" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                <select className="select" value={item.categoryId}
                  onChange={e => updateItem(item._key, 'categoryId', e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cantidad *</label>
                <input type="number" step="0.01" min="0.01" className="input" value={item.quantity}
                  onChange={e => updateItem(item._key, 'quantity', e.target.value)}
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unidad *</label>
                <select className="select" value={item.unitType}
                  onChange={e => updateItem(item._key, 'unitType', e.target.value)}>
                  {unitOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addItem} className="btn-secondary w-full">
        ➕ Agregar otro producto
      </button>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <button onClick={handleSubmit} className="btn-primary w-full" disabled={loading}>
        {loading ? 'Procesando...' : '✅ Confirmar y actualizar stock'}
      </button>
    </div>
  );
}
