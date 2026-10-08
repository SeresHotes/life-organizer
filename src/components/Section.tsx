import { useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { WIDE, useMediaQuery } from '../hooks'

type Props = {
  id: string
  title: string
  count?: number
  /** Form for a new item, opened by the "+" button in the header. */
  add?: (close: () => void) => ReactNode
  children: ReactNode
}

/**
 * Main screen list. Wide screens: a column that can be collapsed on its own.
 * Narrow screens: an accordion — only one section is open, the others are thin bars.
 */
export function Section({ id, title, count, add, children }: Props) {
  const wide = useMediaQuery(WIDE)
  const s = useStore()
  const collapsed = wide ? !!s.collapsed[id] : s.expanded !== id
  const expand = () => (wide ? collapsed && s.toggleCollapsed(id) : s.setExpanded(id))
  const [adding, setAdding] = useState(false)
  return (
    <section className={'section' + (collapsed ? ' collapsed' : '')}>
      <div className="section-head">
        <button className="section-toggle" onClick={() => (wide ? s.toggleCollapsed(id) : s.setExpanded(id))}>
          {wide && <span className="chevron">{collapsed ? '▸' : '▾'}</span>}
          <span className="section-title">{title}</span>
          {count !== undefined && <span className="count">{count}</span>}
        </button>
        {add && (
          <button
            className="add-icon"
            aria-label="Добавить"
            onClick={() => {
              expand()
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
