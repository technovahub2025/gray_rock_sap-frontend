import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildOrderPlan } from './orderPlanning'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const apiUrl = (path) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path)

const emptyOrder = {
  customer: '',
  product: '',
  quantity: 1,
  unit: 'tons',
  deliveryDate: '',
}

const emptyInventory = {
  type: 'Raw',
  name: '',
  quantity: 0,
  unit: 'tons',
  location: '',
}

const stageLabels = {
  intake: 'Intake',
  production: 'Production',
  quality: 'Quality',
  billing: 'Billing',
  dispatch: 'Dispatch',
}

const stageScore = {
  Pending: 0,
  'In Progress': 50,
  Completed: 100,
}

const calcProgress = (stages) => {
  const values = Object.values(stages).map((v) => stageScore[v] ?? 0)
  const total = values.reduce((a, b) => a + b, 0)
  return values.length ? Math.round(total / values.length) : 0
}

export function useOperationsData() {
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  )

  const loadAll = useCallback(
    async (query = '') => {
      try {
        const ordersPath = query ? `/api/orders?q=${encodeURIComponent(query)}` : '/api/orders'
        const [orderRes, inventoryRes] = await Promise.all([
          fetch(apiUrl(ordersPath)),
          fetch(apiUrl('/api/inventory')),
        ])
        if (!orderRes.ok || !inventoryRes.ok) throw new Error('Request failed')
        const [orderData, inventoryData] = await Promise.all([orderRes.json(), inventoryRes.json()])

        setOrders(orderData)
        setInventory(inventoryData)
        setError('')

        if (!orderData.length) {
          setSelectedOrderId(null)
          return
        }

        const selectedExists = orderData.some((order) => order.id === selectedOrderId)
        if (!selectedExists) setSelectedOrderId(orderData[0].id)
      } catch {
        setError('Backend not reachable. Is it running?')
        addToast('error', 'Backend not reachable. Start server and refresh.')
      }
    },
    [addToast, selectedOrderId],
  )

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const createOrder = async (payload) => {
    const res = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const created = await res.json()
      setSelectedOrderId(created.id)
      await loadAll(search)
      addToast('success', `Order #${created.id} created successfully.`)
    } else {
      addToast('error', 'Failed to create order.')
    }
    return res.ok
  }

  const updateOrder = async (id, patch) => {
    const targetId = id ?? selectedOrderId
    if (!targetId) return false

    const res = await fetch(apiUrl(`/api/orders/${targetId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      await loadAll(search)
      addToast('success', `Order #${targetId} updated.`)
    } else {
      addToast('error', `Failed to update order #${targetId}.`)
    }
    return res.ok
  }

  const getStageValidation = useCallback(
    (stageKey, order) => {
      if (!order) return { ok: false, reason: 'Select an order first.' }

      const productionDone = order.stages?.production === 'Completed'
      const qualityDone = order.stages?.quality === 'Completed'
      const billingDone = order.stages?.billing === 'Completed'
      const invoiceAmount = Number(order.invoice?.amount ?? 0)
      const invoicePaid = Boolean(order.invoice?.paid)

      if (stageKey === 'production') {
        const plan = buildOrderPlan(order)
        const rawInventoryByName = inventory
          .filter((item) => item.type === 'Raw')
          .reduce((acc, item) => {
            const key = String(item.name || '').trim().toLowerCase()
            acc[key] = (acc[key] ?? 0) + Number(item.quantity || 0)
            return acc
          }, {})

        const shortages = (plan?.rawMaterials ?? []).filter((material) => {
          const key = String(material.name || '').trim().toLowerCase()
          const available = rawInventoryByName[key] ?? 0
          return available < material.required
        })

        if (shortages.length) {
          const first = shortages[0]
          return {
            ok: false,
            reason: `Insufficient ${first.name}. Add raw stock before production.`,
          }
        }
      }

      if (stageKey === 'quality' && !productionDone) {
        return { ok: false, reason: 'Production must be completed before quality.' }
      }

      if (stageKey === 'quality') {
        const checker = String(order.quality?.approvalBy ?? '').trim()
        const labTest = String(order.quality?.labTest ?? '').trim().toLowerCase()
        if (!checker) {
          return { ok: false, reason: 'Open order and assign quality checker before completion.' }
        }
        if (labTest !== 'pass') {
          return { ok: false, reason: 'Quality result must be Pass before completion.' }
        }
      }

      if (stageKey === 'billing') {
        if (!qualityDone) return { ok: false, reason: 'Quality must be completed before billing.' }
        if (invoiceAmount <= 0) return { ok: false, reason: 'Set invoice amount before billing completion.' }
      }

      if (stageKey === 'dispatch') {
        if (!billingDone) return { ok: false, reason: 'Billing must be completed before dispatch.' }
        if (!invoicePaid) return { ok: false, reason: 'Invoice must be paid before dispatch.' }
        const truck = String(order.dispatch?.truck ?? '').trim()
        const driver = String(order.dispatch?.driver ?? '').trim()
        const route = String(order.dispatch?.route ?? '').trim()
        if (!truck || !driver || !route) {
          return { ok: false, reason: 'Open order and fill dispatch details before completion.' }
        }
      }

      return { ok: true, reason: '' }
    },
    [inventory],
  )

  const markStageDone = async (stageKey, order = selectedOrder) => {
    if (!order) return false
    const validation = getStageValidation(stageKey, order)
    if (!validation.ok) {
      addToast('warning', validation.reason)
      return false
    }

    const nextStages = { ...(order.stages ?? {}), [stageKey]: 'Completed' }
    return updateOrder(order.id, {
      stages: { [stageKey]: 'Completed' },
      status: stageLabels[stageKey] ?? stageKey,
      progress: calcProgress(nextStages),
    })
  }

  const deleteOrder = async (id) => {
    const res = await fetch(apiUrl(`/api/orders/${id}`), { method: 'DELETE' })
    if (res.ok) {
      if (selectedOrderId === id) setSelectedOrderId(null)
      await loadAll(search)
      addToast('success', `Order #${id} deleted.`)
    } else {
      addToast('error', `Failed to delete order #${id}.`)
    }
    return res.ok
  }

  const createInventory = async (payload) => {
    const res = await fetch(apiUrl('/api/inventory'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      await loadAll(search)
      addToast('success', 'Inventory item added.')
    } else {
      addToast('error', 'Failed to add inventory item.')
    }
    return res.ok
  }

  const updateInventory = async (id, patch) => {
    const res = await fetch(apiUrl(`/api/inventory/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      await loadAll(search)
      addToast('success', 'Inventory item updated.')
    } else {
      addToast('error', 'Failed to update inventory item.')
    }
    return res.ok
  }

  const deleteInventory = async (id) => {
    const res = await fetch(apiUrl(`/api/inventory/${id}`), { method: 'DELETE' })
    if (res.ok) {
      await loadAll(search)
      addToast('success', 'Inventory item deleted.')
    } else {
      addToast('error', 'Failed to delete inventory item.')
    }
    return res.ok
  }

  return {
    orders,
    inventory,
    search,
    setSearch,
    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,
    error,
    toasts,
    emptyOrder,
    emptyInventory,
    addToast,
    dismissToast,
    getStageValidation,
    loadAll,
    createOrder,
    updateOrder,
    markStageDone,
    deleteOrder,
    createInventory,
    updateInventory,
    deleteInventory,
  }
}
