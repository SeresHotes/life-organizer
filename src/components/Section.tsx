import type { ReactNode } from 'react'
import { useStore } from '../store'

/** Collapsible, independently scrolling list section of the main screen. */
export function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) {
  const collapsed = useStore((s) => !!s.collapsed[id])
  const toggle = useStore((s) => s.toggleCollapsed)
  return (
    <section className={'section' + (collapsed ? ' collapsed' : '')}>
      <button className="section-head" onClick={() => toggle(id)}>
        <span className="chevron">{collapsed ? '▸' : '▾'}</span>
        <span className="section-title">{title}</span>
        {count !== undefined && <span className="count">{count}</span>}
      </button>
      {!collapsed && <div className="section-body">{children}</div>}
    </section>
  )
}
