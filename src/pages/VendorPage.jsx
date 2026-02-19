import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

export function VendorPage() {
  const data = useOutletContext()

  const totals = useMemo(() => {
    const raw = data.inventory.filter((item) => item.type === 'Raw').length
    const finished = data.inventory.filter((item) => item.type === 'Finished').length
    const openOrders = data.orders.filter((order) => order.status !== 'Completed').length
    return { raw, finished, openOrders }
  }, [data.inventory, data.orders])

  return (
    <section className="single-grid">
      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Vendor Overview</h3>
          <p>Consolidated supply snapshot</p>
        </div>
        <div className="summary-grid">
          <div className="summary-tile">
            <span>Raw Materials</span>
            <strong>{totals.raw}</strong>
          </div>
          <div className="summary-tile">
            <span>Finished Goods</span>
            <strong>{totals.finished}</strong>
          </div>
          <div className="summary-tile">
            <span>Open Orders</span>
            <strong>{totals.openOrders}</strong>
          </div>
        </div>
      </article>
    </section>
  )
}
