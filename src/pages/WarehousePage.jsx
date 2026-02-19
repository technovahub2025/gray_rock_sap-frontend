import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

export function WarehousePage() {
  const data = useOutletContext()
  const [inventoryForm, setInventoryForm] = useState(data.emptyInventory)

  const onSubmit = async (event) => {
    event.preventDefault()
    const ok = await data.createInventory(inventoryForm)
    if (ok) setInventoryForm(data.emptyInventory)
  }

  return (
    <section className="single-grid">
      <article className="surface-card">
        <div className="panel-title-row">
          <h3>Inventory</h3>
          <p>Add or adjust stock in one place</p>
        </div>
        <form className="form-grid inventory-form" onSubmit={onSubmit}>
          <select
            value={inventoryForm.type}
            onChange={(event) => setInventoryForm({ ...inventoryForm, type: event.target.value })}
          >
            <option>Raw</option>
            <option>Finished</option>
          </select>
          <input
            placeholder="Name"
            value={inventoryForm.name}
            onChange={(event) => setInventoryForm({ ...inventoryForm, name: event.target.value })}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Quantity"
            value={inventoryForm.quantity}
            onChange={(event) => setInventoryForm({ ...inventoryForm, quantity: Number(event.target.value) })}
            required
          />
          <input
            placeholder="Unit"
            value={inventoryForm.unit}
            onChange={(event) => setInventoryForm({ ...inventoryForm, unit: event.target.value })}
          />
          <input
            placeholder="Location"
            value={inventoryForm.location}
            onChange={(event) => setInventoryForm({ ...inventoryForm, location: event.target.value })}
          />
          <button className="primary-btn form-submit" type="submit">
            Add Item
          </button>
        </form>

        <div className="inventory-list">
          {data.inventory.map((item) => (
            <div className="inventory-row" key={item.id}>
              <div>
                <h4>
                  {item.type} | {item.name}
                </h4>
                <p>
                  {item.quantity} {item.unit} | {item.location}
                </p>
              </div>
              <div className="inventory-actions">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => data.updateInventory(item.id, { quantity: item.quantity + 10 })}
                >
                  +10
                </button>
                <button className="danger-btn" type="button" onClick={() => data.deleteInventory(item.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!data.inventory.length && <p className="empty-text">No inventory yet.</p>}
        </div>
      </article>
    </section>
  )
}
