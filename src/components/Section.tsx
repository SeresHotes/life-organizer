import { useState, type ReactNode } from 'react'
import { useStore } from '../store'

type Props = {
  id: string
  title: string
  count?: number
  /** Form for a new item, opened by the "+" button in the header. */
  add?: (close: () => void) => ReactNode
  children: ReactNode
}

/** Collapsible, independently scrolling list section of the main screen. */
export function Section({ id, title, count, add, children }: Props) {
  const collapsed = useStore((s) => !!s.collapsed[id])
  const toggle = useStore((s) => s.toggleCollapsed)
  const [adding, setAdding] = useState(false)
  return (
    <section className={'section' + (collapsed ? ' collapsed' : '')}>
      <div className="section-head">
        <button className="section-toggle" onClick={() => toggle(id)}>
          <span className="chevron">{collapsed ? '▸' : '▾'}</span>
          <span className="section-title">{title}</span>
          {count !== undefined && <span className="count">{count}</span>}
        </button>
        {add && (
          <button
            className="add-icon"
            aria-label="Добавить"
            onClick={() => {
              if (collapsed) toggle(id)
              setAdding(true)
            }}
          >
            +
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="section-body">
          {adding && add?.(() => setAdding(false))}
          {children}
        </div>
      )}
    </section>
  )
}
