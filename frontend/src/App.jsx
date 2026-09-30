import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ScanTicket from './pages/ScanTicket';
import AddProduct from './pages/AddProduct';

const navItem = ({ isActive }) =>
  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
  }`;

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <h1 className="text-xl font-bold text-gray-900">Home Stock</h1>
            </div>
            <nav className="flex gap-1">
              <NavLink to="/" end className={navItem}>📊 Dashboard</NavLink>
              <NavLink to="/inventory" className={navItem}>📦 Inventario</NavLink>
              <NavLink to="/scan" className={navItem}>📷 Escanear</NavLink>
              <NavLink to="/add" className={navItem}>➕ Agregar</NavLink>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/scan" element={<ScanTicket />} />
            <Route path="/add" element={<AddProduct />} />
          </Routes>
        </main>

        <footer className="text-center text-xs text-gray-400 py-4">
          Home Stock Manager © 2026
        </footer>
      </div>
    </BrowserRouter>
  );
}
