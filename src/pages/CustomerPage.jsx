import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { money, stageLabels, stageOrder } from '../data/constants'

const orderStages = (order) => {
  if (!order?.stages) return []
  const stageEntries = Object.entries(order.stages)
  const stageMap = new Map(stageEntries)
  const ordered = stageOrder.filter((key) => stageMap.has(key)).map((key) => [key, stageMap.get(key)])
  const remaining = stageEntries.filter(([key]) => !stageOrder.includes(key))
  return [...ordered, ...remaining]
}

export function CustomerPage() {
  const data = useOutletContext()
  const stages = useMemo(() => orderStages(data.selectedOrder), [data.selectedOrder])
  const productionValidation = data.getStageValidation('production', data.selectedOrder)
  const qualityValidation = data.getStageValidation('quality', data.selectedOrder)
  const billingValidation = data.getStageValidation('billing', data.selectedOrder)
  const dispatchValidation = data.getStageValidation('dispatch', data.selectedOrder)

  return (
    <section className="top-grid">
      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Catalog</h3>
          <p>{data.orders.length} orders</p>
        </div>
        <div className="card-stack">
          {data.orders.map((order) => (
            <button
              type="button"
              key={order.id}
              className={`catalog-row ${data.selectedOrderId === order.id ? 'selected' : ''}`}
              onClick={() => data.setSelectedOrderId(order.id)}
            >
              <div className="catalog-icon">{String(order.product || 'P').slice(0, 1)}</div>
              <div className="catalog-main">
                <h4>{order.product || 'Untitled Product'}</h4>
                <p>
                  {order.customer} | {order.quantity} {order.unit}
                </p>
              </div>
              <div className="catalog-meta">
                <span>{money.format(Number(order.invoice?.amount || 0))}</span>
                <span className="pill">{order.status}</span>
              </div>
            </button>
          ))}
          {!data.orders.length && <p className="empty-text">No orders found.</p>}
        </div>
      </article>

      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Your Cart</h3>
          <p>{data.selectedOrder ? `Order #${data.selectedOrder.id}` : 'No selection'}</p>
        </div>

        {!data.selectedOrder ? (
          <div className="cart-empty">
            <div className="empty-bag">[]</div>
            <p>Cart is empty</p>
          </div>
        ) : (
          <>
            <div className="order-summary">
              <h4>{data.selectedOrder.customer}</h4>
              <p>
                {data.selectedOrder.product} | {data.selectedOrder.quantity} {data.selectedOrder.unit}
              </p>
              <div className="progress-line">
                <div style={{ width: `${data.selectedOrder.progress}%` }} />
              </div>
              <p className="progress-label">Progress: {data.selectedOrder.progress}%</p>
            </div>

            <div className="workflow-row">
              {stages.map(([key, value]) => (
                <div key={key} className="workflow-chip">
                  <span>{stageLabels[key] ?? key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="quick-actions">
              <button
                className="ghost-btn"
                type="button"
                disabled={!productionValidation.ok}
                title={productionValidation.ok ? 'Complete stage' : productionValidation.reason}
                onClick={() => data.markStageDone('production')}
              >
                Mark Production Done
              </button>
              <button
                className="ghost-btn"
                type="button"
                disabled={!qualityValidation.ok}
                title={qualityValidation.ok ? 'Complete stage' : qualityValidation.reason}
                onClick={() => data.markStageDone('quality')}
              >
                Mark Quality Done
              </button>
              <button
                className="ghost-btn"
                type="button"
                disabled={!billingValidation.ok}
                title={billingValidation.ok ? 'Complete stage' : billingValidation.reason}
                onClick={() => data.markStageDone('billing')}
              >
                Mark Billing Done
              </button>
              <button
                className="ghost-btn"
                type="button"
                disabled={!dispatchValidation.ok}
                title={dispatchValidation.ok ? 'Complete stage' : dispatchValidation.reason}
                onClick={() => data.markStageDone('dispatch')}
              >
                Mark Dispatch Done
              </button>
            </div>

            <div className="total-row">
              <span>Total</span>
              <strong>{money.format(Number(data.selectedOrder.invoice?.amount || 0))}</strong>
            </div>

            <div className="payment-row">
              <button className="pay-btn" type="button">
                Pay Now
              </button>
              <button className="danger-btn" type="button" onClick={() => data.deleteOrder(data.selectedOrder.id)}>
                Delete
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  )
}
