import { useState, type ReactNode } from 'react'

type Props = {
  title: string
  count?: number
  /** Text of the big add button at the bottom, e.g. "+ Задача". */
  addLabel: string
  /** Form for a new item, shown on top of the list. */
  add: (close: () => void) => ReactNode
  children: ReactNode
}

/** A screen with one list (tasks, thoughts): the list in a panel, the add button at the bottom within thumb reach. */
export function ListScreen({ title, count, addLabel, add, children }: Props) {
  const [adding, setAdding] = useState(false)
  return (
    <div className="list-screen">
      <section className="section">
        <div className="section-head">
          <span className="section-title">{title}</span>
          {count !== undefined && <span className="count">{count}</span>}
        </div>
        <div className="section-body">
          {adding && add(() => setAdding(false))}
          {children}
        </div>
      </section>
      <div className="today-actions">
        <button className="primary" onClick={() => setAdding(true)}>
          {addLabel}
        </button>
      </div>
    </div>
  )
}
