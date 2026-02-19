import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { stageLabels } from '../data/constants'
import { buildOrderPlan, formatDateTime } from '../data/orderPlanning'

export function StageBoard({ stageKey }) {
  const data = useOutletContext()
  const navigate = useNavigate()
  const stageName = stageLabels[stageKey] ?? stageKey
  const isBilling = stageKey === 'billing'
  const isProduction = stageKey === 'production'
  const isQuality = stageKey === 'quality'
  const isDispatch = stageKey === 'dispatch'
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null)
  const [planModalOrder, setPlanModalOrder] = useState(null)
  const [qualityModalOrder, setQualityModalOrder] = useState(null)
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null)
  const [qualityForm, setQualityForm] = useState({
    checkerName: '',
    result: 'Pending',
  })
  const [dispatchForm, setDispatchForm] = useState({
    truck: '',
    driver: '',
    route: '',
  })
  const [invoiceForm, setInvoiceForm] = useState({
    number: '',
    amount: '',
    paid: false,
    cgst: '9',
    sgst: '9',
  })

  const stageOrders = useMemo(
    () =>
      data.orders.filter((order) => {
        const value = order.stages?.[stageKey]
        return value !== 'Completed'
      }),
    [data.orders, stageKey],
  )
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

  const suggestedAmount = (order) => {
    const product = String(order?.product || '').toLowerCase()
    const qty = Number(order?.quantity || 0)
    const rate = product.includes('opc 53') ? 8200 : product.includes('opc 43') ? 7600 : 6800
    return Math.round(qty * rate)
  }

  const openBillingInvoiceModal = (order) => {
    const existingAmount = Number(order?.invoice?.amount || 0)
    const existingCgst = order?.invoice?.cgst
    const existingSgst = order?.invoice?.sgst
    setInvoiceForm({
      number: String(order?.invoice?.number || `INV-${order.id}-${new Date().getFullYear()}`),
      amount: existingAmount > 0 ? String(existingAmount) : String(suggestedAmount(order)),
      paid: Boolean(order?.invoice?.paid),
      cgst: existingCgst !== undefined ? String(existingCgst) : '9',
      sgst: existingSgst !== undefined ? String(existingSgst) : '9',
    })
    setInvoiceModalOrder(order)
  }

  const openQualityModal = (order) => {
    setQualityForm({
      checkerName: String(order?.quality?.approvalBy || ''),
      result: String(order?.quality?.labTest || 'Pending'),
    })
    setQualityModalOrder(order)
  }

  const openDispatchModal = (order) => {
    setDispatchForm({
      truck: String(order?.dispatch?.truck || ''),
      driver: String(order?.dispatch?.driver || ''),
      route: String(order?.dispatch?.route || ''),
    })
    setDispatchModalOrder(order)
  }

  const handleOpen = (order) => {
    data.setSelectedOrderId(order.id)
    if (isBilling) {
      openBillingInvoiceModal(order)
    }
    if (isProduction) {
      setPlanModalOrder(order)
    }
    if (isQuality) {
      openQualityModal(order)
    }
    if (isDispatch) {
      openDispatchModal(order)
    }
  }

  const productionPlan = planModalOrder ? buildOrderPlan(planModalOrder) : null
  const nextStageRoute = {
    production: '/quality',
    quality: '/billing',
    billing: '/shipping',
  }

  const generateInvoice = async () => {
    if (!invoiceModalOrder) return

    const amount = Number(invoiceForm.amount)
    const cgst = Number(invoiceForm.cgst)
    const sgst = Number(invoiceForm.sgst)
    const number = String(invoiceForm.number).trim()
    if (
      !number ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isFinite(cgst) ||
      cgst < 0 ||
      !Number.isFinite(sgst) ||
      sgst < 0
    ) {
      data.addToast('warning', 'Enter a valid invoice number and amount.')
      return
    }

    const cgstAmount = Number(((amount * cgst) / 100).toFixed(2))
    const sgstAmount = Number(((amount * sgst) / 100).toFixed(2))
    const taxTotal = Number((cgstAmount + sgstAmount).toFixed(2))
    const grandTotal = Number((amount + taxTotal).toFixed(2))

    const ok = await data.updateOrder(invoiceModalOrder.id, {
      invoice: {
        number,
        amount,
        paid: invoiceForm.paid,
        cgst,
        sgst,
        cgstAmount,
        sgstAmount,
        taxTotal,
        grandTotal,
      },
      status: 'Billing',
    })
    if (ok) setInvoiceModalOrder(null)
  }

  const downloadInvoice = () => {
    if (!invoiceModalOrder) return

    const amount = Number(invoiceForm.amount) || 0
    const cgst = Number(invoiceForm.cgst) || 0
    const sgst = Number(invoiceForm.sgst) || 0
    const number = String(invoiceForm.number || '').trim() || `INV-${invoiceModalOrder.id}`
    const cgstAmount = Number(((amount * cgst) / 100).toFixed(2))
    const sgstAmount = Number(((amount * sgst) / 100).toFixed(2))
    const taxTotal = Number((cgstAmount + sgstAmount).toFixed(2))
    const grandTotal = Number((amount + taxTotal).toFixed(2))

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Invoice', 14, 18)
    doc.setFontSize(11)
    doc.text(`Invoice No: ${number}`, 14, 28)
    doc.text(`Order: #${invoiceModalOrder.id}`, 14, 34)
    doc.text(`Customer: ${invoiceModalOrder.customer}`, 14, 40)
    doc.text(`Product: ${invoiceModalOrder.product}`, 14, 46)
    doc.text(`Quantity: ${invoiceModalOrder.quantity} ${invoiceModalOrder.unit}`, 14, 52)

    let y = 66
    doc.setFontSize(12)
    doc.text('Amount Summary (INR)', 14, y)
    y += 8
    doc.setFontSize(11)
    doc.text(`Base Amount: ${amount.toFixed(2)}`, 14, y)
    y += 6
    doc.text(`CGST (${cgst}%): ${cgstAmount.toFixed(2)}`, 14, y)
    y += 6
    doc.text(`SGST (${sgst}%): ${sgstAmount.toFixed(2)}`, 14, y)
    y += 6
    doc.text(`Total Tax: ${taxTotal.toFixed(2)}`, 14, y)
    y += 8
    doc.setFontSize(12)
    doc.text(`Grand Total: ${grandTotal.toFixed(2)}`, 14, y)

    doc.save(`${number}.pdf`)
  }

  const saveQualityResult = async () => {
    if (!qualityModalOrder) return

    const checkerName = String(qualityForm.checkerName || '').trim()
    const result = String(qualityForm.result || '').trim()
    if (!checkerName) {
      data.addToast('warning', 'Enter quality checker name.')
      return
    }
    if (!['Pending', 'Pass', 'Failed'].includes(result)) {
      data.addToast('warning', 'Select quality result as Pending, Pass, or Failed.')
      return
    }

    const ok = await data.updateOrder(qualityModalOrder.id, {
      quality: {
        approvalBy: checkerName,
        labTest: result,
      },
      status: 'Quality',
    })
    if (ok) setQualityModalOrder(null)
  }

  const saveDispatchDetails = async () => {
    if (!dispatchModalOrder) return

    const truck = String(dispatchForm.truck || '').trim()
    const driver = String(dispatchForm.driver || '').trim()
    const route = String(dispatchForm.route || '').trim()
    if (!truck || !driver || !route) {
      data.addToast('warning', 'Enter truck, driver, and route details.')
      return
    }

    const ok = await data.updateOrder(dispatchModalOrder.id, {
      dispatch: { truck, driver, route },
      stages: {
        dispatch: 'In Progress',
      },
      status: 'Dispatch',
    })
    if (ok) setDispatchModalOrder(null)
  }

  const handleMarkDone = async (order) => {
    const ok = await data.markStageDone(stageKey, order)
    if (!ok) return
    const nextRoute = nextStageRoute[stageKey]
    if (nextRoute) navigate(nextRoute)
  }

  return (
    <>
      <section className="single-grid">
        <article className="surface-card">
          <div className="panel-title-row">
            <h3>{stageName} Queue</h3>
            <p>{stageOrders.length} pending orders</p>
          </div>
          <div className="inventory-list">
            {stageOrders.map((order) => {
              const validation = data.getStageValidation(stageKey, order)
              return (
                <div className="inventory-row" key={order.id}>
                  <div>
                    <h4>
                      #{order.id} | {order.customer}
                    </h4>
                    <p>
                      {order.product} | Stage status: {order.stages?.[stageKey] ?? 'Pending'}
                    </p>
                    {!validation.ok && <p className="hint-text">{validation.reason}</p>}
                  </div>
                  <div className="inventory-actions">
                    <button className="ghost-btn" type="button" onClick={() => handleOpen(order)}>
                      Open
                    </button>
                    <button
                      className="primary-btn"
                      type="button"
                      disabled={!validation.ok}
                      title={validation.ok ? 'Complete stage' : validation.reason}
                      onClick={() => handleMarkDone(order)}
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              )
            })}
            {!stageOrders.length && <p className="empty-text">No pending orders for this stage.</p>}
          </div>
        </article>
      </section>

      {isBilling && invoiceModalOrder && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Generate Invoice">
          <div className="modal-card">
            <div className="panel-title-row">
              <h3>Generate Invoice</h3>
              <p>Order #{invoiceModalOrder.id}</p>
            </div>

            <p className="modal-subtitle">
              {invoiceModalOrder.customer} | {invoiceModalOrder.product} | {invoiceModalOrder.quantity}{' '}
              {invoiceModalOrder.unit}
            </p>

            <div className="modal-form">
              <label>
                Invoice Number
                <input
                  value={invoiceForm.number}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, number: event.target.value }))}
                />
              </label>
              <label>
                Invoice Amount (INR)
                <input
                  type="number"
                  min="1"
                  value={invoiceForm.amount}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, amount: event.target.value }))}
                />
              </label>
              <div className="tax-grid">
                <label>
                  CGST (%)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={invoiceForm.cgst}
                    onChange={(event) => setInvoiceForm((prev) => ({ ...prev, cgst: event.target.value }))}
                  />
                </label>
                <label>
                  SGST (%)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={invoiceForm.sgst}
                    onChange={(event) => setInvoiceForm((prev) => ({ ...prev, sgst: event.target.value }))}
                  />
                </label>
              </div>
              <div className="invoice-summary">
                <p>
                  CGST Amount:{' '}
                  <strong>
                    {Number((Number(invoiceForm.amount || 0) * Number(invoiceForm.cgst || 0)) / 100).toFixed(2)}
                  </strong>
                </p>
                <p>
                  SGST Amount:{' '}
                  <strong>
                    {Number((Number(invoiceForm.amount || 0) * Number(invoiceForm.sgst || 0)) / 100).toFixed(2)}
                  </strong>
                </p>
                <p>
                  Total GST:{' '}
                  <strong>
                    {Number(
                      (Number(invoiceForm.amount || 0) * (Number(invoiceForm.cgst || 0) + Number(invoiceForm.sgst || 0))) /
                        100,
                    ).toFixed(2)}
                  </strong>
                </p>
                <p>
                  Grand Total:{' '}
                  <strong>
                    {Number(
                      Number(invoiceForm.amount || 0) +
                        (Number(invoiceForm.amount || 0) *
                          (Number(invoiceForm.cgst || 0) + Number(invoiceForm.sgst || 0))) /
                          100,
                    ).toFixed(2)}
                  </strong>
                </p>
              </div>
              <label className="modal-checkbox">
                <input
                  type="checkbox"
                  checked={invoiceForm.paid}
                  onChange={(event) => setInvoiceForm((prev) => ({ ...prev, paid: event.target.checked }))}
                />
                Mark as paid
              </label>
            </div>

            <div className="modal-actions">
              <button className="ghost-btn" type="button" onClick={downloadInvoice}>
                Download Invoice
              </button>
              <button className="ghost-btn" type="button" onClick={() => setInvoiceModalOrder(null)}>
                Cancel
              </button>
              <button className="primary-btn" type="button" onClick={generateInvoice}>
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {isProduction && planModalOrder && productionPlan && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Order Requirement Plan">
          <div className="modal-card modal-card-wide">
            <div className="panel-title-row">
              <h3>Order Requirement Plan</h3>
              <p>Order #{planModalOrder.id}</p>
            </div>

            <div className="requirement-grid">
              <div className="requirement-block">
                <h4>Order</h4>
                <p>
                  <strong>{planModalOrder.product}</strong> for {planModalOrder.customer}
                </p>
                <p>
                  Quantity: {planModalOrder.quantity} {planModalOrder.unit}
                </p>
                <p>Status: {planModalOrder.status}</p>
              </div>

              <div className="requirement-block">
                <h4>Raw Materials Needed</h4>
                <div className="material-list">
                  {productionPlan.rawMaterials.map((item) => (
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
                  Manpower Needed: <strong>{productionPlan.manpower} people</strong>
                </p>
                <p>
                  Machine Needed: <strong>{productionPlan.machines} machines</strong>
                </p>
                <p>
                  Total Workload: <strong>{productionPlan.totalHours} hrs</strong>
                </p>
                <p>
                  Remaining Effort: <strong>{productionPlan.remainingHours} hrs</strong>
                </p>
                <p>
                  Estimated Ready Time: <strong>{formatDateTime(productionPlan.readyAt)}</strong>
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="ghost-btn" type="button" onClick={() => setPlanModalOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isQuality && qualityModalOrder && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quality Check">
          <div className="modal-card">
            <div className="panel-title-row">
              <h3>Quality Check</h3>
              <p>Order #{qualityModalOrder.id}</p>
            </div>

            <p className="modal-subtitle">
              {qualityModalOrder.customer} | {qualityModalOrder.product} | {qualityModalOrder.quantity}{' '}
              {qualityModalOrder.unit}
            </p>

            <div className="modal-form">
              <label>
                Quality Checker Name
                <input
                  value={qualityForm.checkerName}
                  onChange={(event) =>
                    setQualityForm((prev) => ({ ...prev, checkerName: event.target.value }))
                  }
                />
              </label>

              <label>
                Quality Result
                <select
                  value={qualityForm.result}
                  onChange={(event) => setQualityForm((prev) => ({ ...prev, result: event.target.value }))}
                >
                  <option value="Pending">Pending</option>
                  <option value="Pass">Pass</option>
                  <option value="Failed">Failed</option>
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button className="ghost-btn" type="button" onClick={() => setQualityModalOrder(null)}>
                Cancel
              </button>
              <button className="primary-btn" type="button" onClick={saveQualityResult}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isDispatch && dispatchModalOrder && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Dispatch Details">
          <div className="modal-card">
            <div className="panel-title-row">
              <h3>Dispatch Details</h3>
              <p>Order #{dispatchModalOrder.id}</p>
            </div>

            <p className="modal-subtitle">
              {dispatchModalOrder.customer} | {dispatchModalOrder.product} | {dispatchModalOrder.quantity}{' '}
              {dispatchModalOrder.unit}
            </p>

            <div className="modal-form">
              <label>
                Truck Number
                <input
                  value={dispatchForm.truck}
                  onChange={(event) => setDispatchForm((prev) => ({ ...prev, truck: event.target.value }))}
                />
              </label>

              <label>
                Driver Name
                <input
                  value={dispatchForm.driver}
                  onChange={(event) => setDispatchForm((prev) => ({ ...prev, driver: event.target.value }))}
                />
              </label>

              <label>
                Route
                <input
                  value={dispatchForm.route}
                  onChange={(event) => setDispatchForm((prev) => ({ ...prev, route: event.target.value }))}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="ghost-btn" type="button" onClick={() => setDispatchModalOrder(null)}>
                Cancel
              </button>
              <button className="primary-btn" type="button" onClick={saveDispatchDetails}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
