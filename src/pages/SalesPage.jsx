import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { buildOrderPlan, formatDateTime } from '../data/orderPlanning'

export function SalesPage() {
  const data = useOutletContext()
  const [orderForm, setOrderForm] = useState(data.emptyOrder)
  const plan = buildOrderPlan(data.selectedOrder)
  const rawInventoryByName = useMemo(() => {
    return data.inventory
      .filter((item) => item.type === 'Raw')
      .reduce((acc, item) => {
        const key = String(item.name || '').trim().toLowerCase()
        acc[key] = (acc[key] ?? 0) + Number(item.quantity || 0)
        return acc
      }, {})
  }, [data.inventory])

  const isMaterialShort = (material) => {
    const key = String(material?.name || '').trim().toLowerCase()
    const available = rawInventoryByName[key] ?? 0
    return available < Number(material?.required ?? 0)
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const ok = await data.createOrder(orderForm)
    if (ok) setOrderForm(data.emptyOrder)
  }

  return (
    <section className="single-grid">
      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Create New Order</h3>
          <p>Push directly to operations queue</p>
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <input
            placeholder="Customer"
            value={orderForm.customer}
            onChange={(event) => setOrderForm({ ...orderForm, customer: event.target.value })}
            required
          />
          <input
            placeholder="Product"
            value={orderForm.product}
            onChange={(event) => setOrderForm({ ...orderForm, product: event.target.value })}
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={orderForm.quantity}
            onChange={(event) => setOrderForm({ ...orderForm, quantity: Number(event.target.value) })}
            required
          />
          <input
            placeholder="Unit"
            value={orderForm.unit}
            onChange={(event) => setOrderForm({ ...orderForm, unit: event.target.value })}
          />
          <input
            type="date"
            value={orderForm.deliveryDate}
            onChange={(event) => setOrderForm({ ...orderForm, deliveryDate: event.target.value })}
          />
          <button className="primary-btn form-submit" type="submit">
            Create Order
          </button>
        </form>
      </article>

      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Order Queue</h3>
          <p>{data.orders.length} active records</p>
        </div>
        <div className="inventory-list">
          {data.orders.map((order) => (
            <button
              type="button"
              key={order.id}
              className={`inventory-row ${data.selectedOrderId === order.id ? 'selected-row' : ''}`}
              onClick={() => data.setSelectedOrderId(order.id)}
            >
              <div>
                <h4>
                  #{order.id} | {order.customer}
                </h4>
                <p>
                  {order.product} | {order.quantity} {order.unit} | {order.status}
                </p>
              </div>
            </button>
          ))}
          {!data.orders.length && <p className="empty-text">No orders yet.</p>}
        </div>
      </article>

      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Order Requirement Plan</h3>
          <p>{data.selectedOrder ? `Order #${data.selectedOrder.id}` : 'No order selected'}</p>
        </div>
        {!data.selectedOrder || !plan ? (
          <p className="empty-text">Select an order to view materials, manpower, and ready time.</p>
        ) : (
          <div className="requirement-grid">
            <div className="requirement-block">
              <h4>Order</h4>
              <p>
                <strong>{data.selectedOrder.product}</strong> for {data.selectedOrder.customer}
              </p>
              <p>
                Quantity: {data.selectedOrder.quantity} {data.selectedOrder.unit}
              </p>
              <p>Status: {data.selectedOrder.status}</p>
            </div>

            <div className="requirement-block">
              <h4>Raw Materials Needed</h4>
              <div className="material-list">
                {plan.rawMaterials.map((item) => (
                  <p key={item.name} className={isMaterialShort(item) ? 'insufficient' : ''}>
                    <span>{item.name}</span>
                    <strong>
                      {item.required} {item.unit}
                    </strong>
                  </p>
                ))}
              </div>
            </div>

            <div className="requirement-block">
              <h4>Resource Estimate</h4>
              <p>
                Manpower Needed: <strong>{plan.manpower} people</strong>
              </p>
              <p>
                Machine Needed: <strong>{plan.machines} machines</strong>
              </p>
              <p>
                Total Workload: <strong>{plan.totalHours} hrs</strong>
              </p>
              <p>
                Remaining Effort: <strong>{plan.remainingHours} hrs</strong>
              </p>
              <p>
                Estimated Ready Time: <strong>{formatDateTime(plan.readyAt)}</strong>
              </p>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
