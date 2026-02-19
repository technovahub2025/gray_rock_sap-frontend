import { useOutletContext } from 'react-router-dom'
import { stageLabels, stageOrder } from '../data/constants'

export function PlanningPage() {
  const data = useOutletContext()

  return (
    <section className="single-grid">
      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Pipeline View</h3>
          <p>Track stage progression for each order</p>
        </div>
        <div className="inventory-list">
          {data.orders.map((order) => (
            <div className="inventory-row" key={order.id}>
              <div className="pipeline-head">
                <h4>
                  #{order.id} | {order.customer} | {order.product}
                </h4>
                <strong>{order.progress}%</strong>
              </div>
              <div className="workflow-row">
                {stageOrder.map((stage) => (
                  <div className="workflow-chip" key={`${order.id}-${stage}`}>
                    <span>{stageLabels[stage]}</span>
                    <strong>{order.stages?.[stage] ?? 'Pending'}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!data.orders.length && <p className="empty-text">No planning records available.</p>}
        </div>
      </article>
    </section>
  )
}
