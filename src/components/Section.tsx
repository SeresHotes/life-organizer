import { useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { WIDE, useMediaQuery } from '../hooks'

type Props = {
  /** Screen the section belongs to: each screen has its own accordion. */
  group: string
  id: string
  /** Expanded on narrow screens until another section of the group is opened. */
  defaultExpanded?: boolean
  title: string
  count?: number
  /** Form for a new item, opened by the "+" button in the header. */
  add?: (close: () => void) => ReactNode
  children: ReactNode
}

/**
 * A list column of the tasks / thoughts screens. Wide screens: a column that can be collapsed on its own.
 * Narrow screens: an accordion — only one section is open, the others are thin bars.
 */
export function Section({ group, id, defaultExpanded, title, count, add, children }: Props) {
  const wide = useMediaQuery(WIDE)
  const s = useStore()
  const open = s.expanded[group] ?? (defaultExpanded ? id : null)
  const collapsed = wide ? !!s.collapsed[id] : open !== id
  const expand = () => (wide ? collapsed && s.toggleCollapsed(id) : s.setExpanded(group, id))
  const [adding, setAdding] = useState(false)
  return (
    <section className={'section' + (collapsed ? ' collapsed' : '')}>
      <div className="section-head">
        <button className="section-toggle" onClick={() => (wide ? s.toggleCollapsed(id) : s.setExpanded(group, id))}>
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
