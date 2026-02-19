import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ToastStack } from '../components/ToastStack'
import { navItems } from '../data/constants'
import { useOperationsData } from '../data/useOperationsData'

const pageDescriptions = {
  '/order': {
    title: 'Order Dashboard',
    subtitle: 'Create and manage incoming customer orders',
  },
  '/customer': {
    title: 'Customer Dashboard',
    subtitle: 'View catalog, track selected order, and complete workflow',
  },
  '/planning': {
    title: 'Planning',
    subtitle: 'Monitor order pipeline and stage-level progress',
  },
  '/production': {
    title: 'Production',
    subtitle: 'Complete production stage and push orders forward',
  },
  '/quality': {
    title: 'Quality',
    subtitle: 'Validate quality stage before billing handoff',
  },
  '/warehouse': {
    title: 'Warehouse',
    subtitle: 'Manage inventory and stock movement',
  },
  '/shipping': {
    title: 'Shipping',
    subtitle: 'Finalize dispatch and outbound movement',
  },
  '/billing': {
    title: 'Billing',
    subtitle: 'Review invoice amounts and billing completion',
  },
  '/vendor': {
    title: 'Vendor',
    subtitle: 'Vendor-side visibility into supply and order mix',
  },
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Daily KPIs, delays, and operational alerts',
  },
}

export function AppLayout() {
  const location = useLocation()
  const data = useOperationsData()
  const current = pageDescriptions[location.pathname] ?? pageDescriptions['/order']

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>GreyRock</h1>
          <p>Order to Delivery System</p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-dot" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="status-card">
          <h3>System Status</h3>
          <p>
            <span className="status-dot" />
            Online
          </p>
        </div>
      </aside>

      <main className="main-area">
        <header className="header-bar">
          <div>
            <h2>{current.title}</h2>
            <p>{current.subtitle}</p>
          </div>
          <div className="header-actions">
            <input
              className="search-input"
              placeholder="Search order by id or customer"
              value={data.search}
              onChange={(event) => data.setSearch(event.target.value)}
            />
            <button className="ghost-btn" type="button" onClick={() => data.loadAll(data.search)}>
              Search
            </button>
            <button className="primary-btn" type="button" onClick={() => data.loadAll(data.search)}>
              Refresh
            </button>
            {/* <div className="avatar">AD</div> */}
          </div>
        </header>

        {data.error && <p className="error-text">{data.error}</p>}
        <Outlet context={data} />
      </main>

      <ToastStack toasts={data.toasts} onClose={data.dismissToast} />
    </div>
  )
}
