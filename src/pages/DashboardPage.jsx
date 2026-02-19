import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { money } from '../data/constants'

const isDelayed = (order) => {
  if (!order?.deliveryDate) return false
  const delivery = new Date(order.deliveryDate)
  if (Number.isNaN(delivery.getTime())) return false
  return delivery < new Date() && order.status !== 'Completed'
}

export function DashboardPage() {
  const data = useOutletContext()

  const metrics = useMemo(() => {
    const totalOrders = data.orders.length
    const delayedOrders = data.orders.filter(isDelayed).length
    const inProgress = data.orders.filter((order) => Number(order.progress || 0) < 100).length
    const totalInvoice = data.orders.reduce(
      (sum, order) => sum + Number(order.invoice?.amount || 0),
      0,
    )
    const lowStock = data.inventory.filter(
      (item) => item.type === 'Raw' && Number(item.quantity || 0) < 200,
    ).length

    return { totalOrders, delayedOrders, inProgress, totalInvoice, lowStock }
  }, [data.inventory, data.orders])

  return (
    <section className="single-grid">
      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Operations KPIs</h3>
          <p>Real-time operational snapshot</p>
        </div>
        <div className="summary-grid">
          <div className="summary-tile">
            <span>Total Orders</span>
            <strong>{metrics.totalOrders}</strong>
          </div>
          <div className="summary-tile">
            <span>In Progress</span>
            <strong>{metrics.inProgress}</strong>
          </div>
          <div className="summary-tile">
            <span>Delayed Orders</span>
            <strong>{metrics.delayedOrders}</strong>
          </div>
          <div className="summary-tile">
            <span>Low Raw Stock</span>
            <strong>{metrics.lowStock}</strong>
          </div>
          <div className="summary-tile">
            <span>Invoice Pipeline</span>
            <strong>{money.format(metrics.totalInvoice)}</strong>
          </div>
        </div>
      </article>

      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Alerts</h3>
          <p>Actionable operations issues</p>
        </div>
        <div className="inventory-list">
          {data.orders.filter(isDelayed).map((order) => (
            <div className="inventory-row" key={order.id}>
              <div>
                <h4>Delayed: Order #{order.id}</h4>
                <p>
                  {order.customer} | Delivery date {order.deliveryDate} | Status {order.status}
                </p>
              </div>
            </div>
          ))}
          {data.inventory
            .filter((item) => item.type === 'Raw' && Number(item.quantity || 0) < 200)
            .map((item) => (
              <div className="inventory-row" key={`low-${item.id}`}>
                <div>
                  <h4>Low Stock: {item.name}</h4>
                  <p>
                    Available {item.quantity} {item.unit} at {item.location}
                  </p>
                </div>
              </div>
            ))}

          {!metrics.delayedOrders && !metrics.lowStock && (
            <p className="empty-text">No delays or low-stock alerts right now.</p>
          )}
        </div>
      </article>
    </section>
  )
}
