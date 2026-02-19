export const navItems = [
  { label: 'Order', path: '/order' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Customer', path: '/customer' },
  { label: 'Planning', path: '/planning' },
  { label: 'Production', path: '/production' },
  { label: 'Quality', path: '/quality' },
  { label: 'Billing', path: '/billing' },
  { label: 'Shipping', path: '/shipping' },
  { label: 'Warehouse', path: '/warehouse' },
  { label: 'Vendor', path: '/vendor' },
]

export const stageOrder = ['intake', 'production', 'quality', 'billing', 'dispatch']

export const stageLabels = {
  intake: 'Intake',
  production: 'Production',
  quality: 'Quality',
  billing: 'Billing',
  dispatch: 'Dispatch',
}

export const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
