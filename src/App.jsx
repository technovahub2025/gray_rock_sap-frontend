import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './layout/AppLayout'
import { BillingPage } from './pages/BillingPage'
import { CustomerPage } from './pages/CustomerPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlanningPage } from './pages/PlanningPage'
import { ProductionPage } from './pages/ProductionPage'
import { QualityPage } from './pages/QualityPage'
import { SalesPage } from './pages/SalesPage'
import { ShippingPage } from './pages/ShippingPage'
import { VendorPage } from './pages/VendorPage'
import { WarehousePage } from './pages/WarehousePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/order" replace />} />
        <Route path="order" element={<SalesPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="sales" element={<Navigate to="/order" replace />} />
        <Route path="customer" element={<CustomerPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="quality" element={<QualityPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="shipping" element={<ShippingPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="vendor" element={<VendorPage />} />
      </Route>
    </Routes>
  )
}

export default App
