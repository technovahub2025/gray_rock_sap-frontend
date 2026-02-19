const DEFAULT_RECIPE = {
  limestone: 0.8,
  gypsum: 0.05,
  clay: 0.15,
}

const RECIPES = {
  'opc 53': {
    limestone: 0.82,
    gypsum: 0.05,
    clay: 0.13,
  },
  'opc 43': {
    limestone: 0.8,
    gypsum: 0.06,
    clay: 0.14,
  },
  ppc: {
    limestone: 0.65,
    gypsum: 0.05,
    flyash: 0.3,
  },
}

const materialLabel = (name) => {
  if (name === 'flyash') return 'Fly Ash'
  return name.slice(0, 1).toUpperCase() + name.slice(1)
}

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)

export function buildOrderPlan(order) {
  if (!order) return null

  const quantity = Number(order.quantity || 0)
  const productKey = String(order.product || '').trim().toLowerCase()
  const recipe = RECIPES[productKey] ?? DEFAULT_RECIPE

  const rawMaterials = Object.entries(recipe).map(([name, ratio]) => ({
    name: materialLabel(name),
    required: Number((quantity * ratio).toFixed(2)),
    unit: order.unit || 'tons',
  }))

  const baseHours = quantity / 24
  const qualityHours = Math.max(2, quantity / 120)
  const dispatchHours = Math.max(1.5, quantity / 180)
  const totalHours = baseHours + qualityHours + dispatchHours
  const remainingFactor = 1 - Number(order.progress || 0) / 100
  const remainingHours = Math.max(1, totalHours * Math.max(0.15, remainingFactor))
  const manpower = Math.max(4, Math.ceil(quantity / 45) + 3)
  const machines = Math.max(2, Math.ceil(manpower / 3))

  const readyAt = new Date(Date.now() + remainingHours * 60 * 60 * 1000)
  return {
    rawMaterials,
    manpower,
    machines,
    totalHours: Number(totalHours.toFixed(1)),
    remainingHours: Number(remainingHours.toFixed(1)),
    readyAt,
  }
}


