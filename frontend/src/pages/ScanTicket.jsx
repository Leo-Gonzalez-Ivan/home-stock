import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { scanQr, processTicket, getCategories, lookupBarcode } from '../api/homeStockApi';
import { useNavigate } from 'react-router-dom';

const unitOptions = [
  { value: 'UNITS', label: 'Unidades' },
  { value: 'GRAMS', label: 'Gramos (g)' },
  { value: 'MILLILITERS', label: 'Mililitros (ml)' },
];
const unitShort = (t) => ({ UNITS: 'u.', GRAMS: 'g', MILLILITERS: 'ml' }[t] || t);

export default function ScanTicket() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState('ticket');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  // Ticket mode
  const [ticketStep, setTicketStep] = useState('scan');
  const [scannedQr, setScannedQr] = useState(null);
  const [ticketItems, setTicketItems] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [autoDetected, setAutoDetected] = useState(false);

  // Barcode mode
  const [barcodeStep, setBarcodeStep] = useState('scan');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [scannedProducts, setScannedProducts] = useState([]);
  const [lastBarcode, setLastBarcode] = useState('');

  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(console.error);
    return () => stopCamera();
  }, []);

  useEffect(() => {
    stopCamera();
    setError('');
    if (mode === 'ticket') setTicketStep('scan');
    else { setBarcodeStep('scan'); setCurrentProduct(null); }
  }, [mode]);

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
    } catch { setError('No se pudo acceder a la cámara. Verificá los permisos.'); }
  };

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(tick); return;
    }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code) {
      stopCamera();
      if (mode === 'ticket') handleTicketQr(code.data);
      else handleBarcode(code.data);
    } else { animRef.current = requestAnimationFrame(tick); }
  }, [mode]);

  // ── TICKET MODE ──
  const handleTicketQr = async (qrData) => {
    setScannedQr(qrData); setLoading(true); setError('');
    try {
      const res = await scanQr(qrData);
      const dto = res.data;
      setStoreName(dto.storeName || '');
      if (dto.items && dto.items.length > 0) {
        setTicketItems(dto.items.map((it, i) => ({ ...it, _key: i, quantity: String(it.quantity) })));
        setAutoDetected(true);
      } else {
        setAutoDetected(false);
        setTicketItems([emptyItem(0)]);
        setError('No se pudieron detectar los productos automáticamente. Podés cargarlos manualmente o usar "Producto por producto".');
      }
      setTicketStep('review');
    } catch { setAutoDetected(false); setTicketItems([emptyItem(0)]); setTicketStep('review'); setError('Error al procesar el QR.'); }
    finally { setLoading(false); }
  };

  const emptyItem = (key) => ({ _key: key, productName: '', brand: '', categoryId: '', unitType: 'UNITS', quantity: '' });
  const addItem = () => setTicketItems(prev => [...prev, emptyItem(Date.now())]);
  const removeItem = (key) => setTicketItems(prev => prev.filter(it => it._key !== key));
  const updateItem = (key, field, value) => setTicketItems(prev => prev.map(it => it._key === key ? { ...it, [field]: value } : it));

  const submitTicket = async () => {
    setError('');
    const valid = ticketItems.filter(it => it.productName?.trim() && parseFloat(it.quantity) > 0);
    if (valid.length === 0) { setError('Agregá al menos un producto con nombre y cantidad mayor a 0'); return; }
    setLoading(true);
    try {
      await processTicket({ rawQrData: scannedQr || null, storeName: storeName || null, items: valid.map(it => ({ productName: it.productName.trim(), brand: it.brand || null, categoryId: it.categoryId ? Number(it.categoryId) : null, unitType: it.unitType, quantity: parseFloat(it.quantity) })) });
      setTicketStep('done');
    } catch (err) { setError(err.response?.data?.error || 'Error al procesar el ticket'); }
    finally { setLoading(false); }
  };

  // ── BARCODE MODE ──
  const handleBarcode = async (barcode) => {
    if (barcode === lastBarcode) { startCamera(); return; }
    setLastBarcode(barcode); setLoading(true); setError('');
    try {
      const res = await lookupBarcode(barcode);
      setCurrentProduct({ ...res.data, quantity: '1', barcode });
      setBarcodeStep('confirm');
    } catch (err) {
      if (err.response?.status === 404) {
        setCurrentProduct({ name: '', brand: '', categoryId: '', unitType: 'UNITS', quantity: '1', barcode, notFound: true });
        setBarcodeStep('confirm');
      } else { setError('Error al buscar el producto. Intentá de nuevo.'); startCamera(); }
    } finally { setLoading(false); }
  };

  const confirmProduct = () => {
    if (!currentProduct?.name?.trim()) { setError('El nombre es obligatorio'); return; }
    const qty = parseFloat(currentProduct.quantity);
    if (isNaN(qty) || qty <= 0) { setError('La cantidad debe ser mayor a 0'); return; }
    setScannedProducts(prev => [...prev, { ...currentProduct, _key: Date.now() }]);
    setCurrentProduct(null); setLastBarcode(''); setError(''); setBarcodeStep('scan');
    startCamera();
  };

  const removeScanned = (key) => setScannedProducts(prev => prev.filter(p => p._key !== key));

  const submitBarcodeProducts = async () => {
    if (scannedProducts.length === 0) { setError('Escaneá al menos un producto'); return; }
    setLoading(true); setError('');
    try {
      await processTicket({ rawQrData: null, storeName: null, items: scannedProducts.map(p => ({ productName: p.name.trim(), brand: p.brand || null, categoryId: p.categoryId ? Number(p.categoryId) : null, unitType: p.unitType || 'UNITS', quantity: parseFloat(p.quantity) })) });
      setBarcodeStep('done');
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar los productos'); }
    finally { setLoading(false); }
  };

  const CameraView = ({ hint }) => (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {!scanning && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white"><div className="text-5xl mb-3">📷</div><p className="text-sm opacity-75">Presioná para activar la cámara</p></div>
          </div>
        )}
        {scanning && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-52 h-52 border-4 border-green-400 rounded-xl opacity-80 animate-pulse" /></div>}
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="text-white text-center"><div className="text-3xl mb-2">⏳</div><p className="text-sm">Buscando...</p></div></div>}
      </div>
      {hint && <p className="text-sm text-gray-500 text-center">{hint}</p>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      <div className="flex gap-3">
        {!scanning
          ? <button onClick={startCamera} className="btn-primary flex-1">📷 Activar cámara</button>
          : <button onClick={stopCamera} className="btn-secondary flex-1">⏹ Detener</button>}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Escanear productos</h2>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button onClick={() => setMode('ticket')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'ticket' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>🧾 Ticket completo</button>
        <button onClick={() => setMode('barcode')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'barcode' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>📦 Producto por producto</button>
      </div>

      {mode === 'ticket' && (
        <div className="card space-y-4">
          {ticketStep === 'scan' && (
            <>
              <p className="text-sm text-gray-600">Escaneá el <strong>código QR</strong> del ticket. Si los productos están disponibles en AFIP, se cargan automáticamente.</p>
              <CameraView hint="Apuntá al QR del ticket" />
              <button onClick={() => { setScannedQr(null); setAutoDetected(false); setTicketItems([emptyItem(0)]); setTicketStep('review'); }} className="btn-secondary w-full text-sm">✏️ Cargar manualmente sin QR</button>
            </>
          )}

          {ticketStep === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Revisá los productos</h3>
                <button onClick={() => { stopCamera(); setTicketStep('scan'); setError(''); }} className="text-sm text-gray-500">← Volver</button>
              </div>
              {autoDetected && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✅ Se detectaron <strong>{ticketItems.length} productos</strong> automáticamente.</div>}
              {!autoDetected && error && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  {error}
                  <button onClick={() => setMode('barcode')} className="block mt-2 text-green-600 font-medium underline">→ Cambiar a modo "Producto por producto"</button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input className="input" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Ej: Carrefour" />
              </div>
              <div className="space-y-3">
                {ticketItems.map((item, index) => (
                  <div key={item._key} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600">Producto #{index + 1}</span>
                      {ticketItems.length > 1 && <button onClick={() => removeItem(item._key)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Nombre *</label><input className="input" value={item.productName} onChange={e => updateItem(item._key, 'productName', e.target.value)} placeholder="Ej: Arroz" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Marca</label><input className="input" value={item.brand || ''} onChange={e => updateItem(item._key, 'brand', e.target.value)} placeholder="Ej: Molinos" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Categoría</label><select className="select" value={item.categoryId || ''} onChange={e => updateItem(item._key, 'categoryId', e.target.value)}><option value="">Sin categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Cantidad *</label><input type="number" step="0.01" min="0.01" className="input" value={item.quantity} onChange={e => updateItem(item._key, 'quantity', e.target.value)} placeholder="0" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Unidad</label><select className="select" value={item.unitType} onChange={e => updateItem(item._key, 'unitType', e.target.value)}>{unitOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addItem} className="btn-secondary w-full text-sm">➕ Agregar producto</button>
              {autoDetected && error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
              <button onClick={submitTicket} className="btn-primary w-full" disabled={loading}>{loading ? 'Guardando...' : `✅ Confirmar ${ticketItems.filter(it => it.productName?.trim()).length} producto(s)`}</button>
            </div>
          )}

          {ticketStep === 'done' && (
            <div className="text-center space-y-4 py-6">
              <div className="text-6xl">✅</div>
              <h3 className="text-xl font-bold">¡Stock actualizado!</h3>
              <div className="flex gap-3 justify-center">
                <button onClick={() => navigate('/inventory')} className="btn-primary">Ver inventario</button>
                <button onClick={() => { setTicketStep('scan'); setScannedQr(null); setTicketItems([]); setAutoDetected(false); setError(''); }} className="btn-secondary">Escanear otro</button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'barcode' && (
        <div className="space-y-4">
          {scannedProducts.length > 0 && (
            <div className="card space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Escaneados ({scannedProducts.length})</h3>
                <button onClick={submitBarcodeProducts} className="btn-primary text-sm py-1.5" disabled={loading}>{loading ? 'Guardando...' : '✅ Confirmar todo'}</button>
              </div>
              {scannedProducts.map(p => (
                <div key={p._key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                  <div><span className="font-medium">{p.name}</span>{p.brand && <span className="text-gray-400 ml-1">— {p.brand}</span>}</div>
                  <div className="flex items-center gap-3"><span className="text-gray-600 font-semibold">{p.quantity} {unitShort(p.unitType)}</span><button onClick={() => removeScanned(p._key)} className="text-red-400 hover:text-red-600">✕</button></div>
                </div>
              ))}
              {error && <div className="p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
            </div>
          )}

          {barcodeStep === 'scan' && (
            <div className="card space-y-4">
              <p className="text-sm text-gray-600">Apuntá la cámara al <strong>código de barras</strong> de cada producto. El nombre y la marca se completan solos.</p>
              <CameraView hint="Escaneá el código de barras del producto" />
            </div>
          )}

          {barcodeStep === 'confirm' && currentProduct && (
            <div className="card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Confirmar producto</h3>
                <button onClick={() => { setBarcodeStep('scan'); setCurrentProduct(null); setError(''); startCamera(); }} className="text-sm text-gray-500">← Volver</button>
              </div>
              {currentProduct.notFound
                ? <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">⚠️ Producto no encontrado. Completá los datos manualmente.</div>
                : <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✅ Producto encontrado automáticamente. Revisá y ajustá la cantidad.</div>}
              <div className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Nombre *</label><input className="input" value={currentProduct.name || ''} onChange={e => setCurrentProduct(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del producto" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Marca</label><input className="input" value={currentProduct.brand || ''} onChange={e => setCurrentProduct(p => ({ ...p, brand: e.target.value }))} placeholder="Marca" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Categoría</label><select className="select" value={currentProduct.categoryId || ''} onChange={e => setCurrentProduct(p => ({ ...p, categoryId: e.target.value }))}><option value="">Sin categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Cantidad *</label><input type="number" step="0.01" min="0.01" className="input" value={currentProduct.quantity} onChange={e => setCurrentProduct(p => ({ ...p, quantity: e.target.value }))} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Unidad</label><select className="select" value={currentProduct.unitType || 'UNITS'} onChange={e => setCurrentProduct(p => ({ ...p, unitType: e.target.value }))}>{unitOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                </div>
              </div>
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              <button onClick={confirmProduct} className="btn-primary w-full">✅ Agregar y escanear siguiente</button>
            </div>
          )}

          {barcodeStep === 'done' && (
            <div className="card text-center space-y-4 py-6">
              <div className="text-6xl">✅</div>
              <h3 className="text-xl font-bold">¡Stock actualizado!</h3>
              <p className="text-gray-600">{scannedProducts.length} producto(s) agregados.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => navigate('/inventory')} className="btn-primary">Ver inventario</button>
                <button onClick={() => { setBarcodeStep('scan'); setScannedProducts([]); setCurrentProduct(null); setError(''); }} className="btn-secondary">Escanear más</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
