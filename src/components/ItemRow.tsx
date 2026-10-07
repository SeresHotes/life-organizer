import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
import { INTERVALS, intervalLabel, useStore } from '../store'

type Props = {
  text: string
  done?: boolean
  /** 'check' — checkbox (tasks, routines); 'archive' — archive button (notes). */
  toggleKind?: 'check' | 'archive'
  onToggle?: () => void
  onSave: (text: string) => void
  onDelete?: () => void
  sphereId?: string | null
  /** If set, the sphere can be changed while editing. */
  onSphere?: (id: string | null) => void
  badge?: ReactNode
  /** Small text on the right (e.g. time until a routine opens again). */
  meta?: ReactNode
  /** Extra controls shown while editing (e.g. routine interval). */
  editExtra?: ReactNode
}

/** One- or two-line item: checkbox, clamped text (tap to edit), long press to drag. */
export function ItemRow({ text, done, toggleKind = 'check', onToggle, onSave, onDelete, sphereId, onSphere, badge, meta, editExtra }: Props) {
  const [editing, setEditing] = useState(false)
  const sphere = useStore((s) => (sphereId ? s.spheres.find((x) => x.id === sphereId) : undefined))
  return (
    <div className={'item' + (done ? ' done' : '')}>
      {onToggle && toggleKind === 'check' && (
        <button className={'check' + (done ? ' checked' : '')} onClick={onToggle} aria-label={done ? 'Открыть' : 'Выполнить'}>
          {done ? '✓' : ''}
        </button>
      )}
      {onToggle && toggleKind === 'archive' && (
        <button className="archive-btn" onClick={onToggle} title={done ? 'Вернуть из архива' : 'В архив'}>
          {done ? '↩' : <ArchiveIcon />}
        </button>
      )}
      {editing ? (
        <ItemEditor
          initial={text}
          sphereId={sphereId ?? null}
          onSphere={onSphere}
          onSave={(t) => {
            setEditing(false)
            if (t && t !== text) onSave(t)
          }}
          onCancel={() => setEditing(false)}
          onDelete={onDelete}
          extra={editExtra}
        />
      ) : (
        <div className="item-body" onClick={() => setEditing(true)}>
          {badge}
          <span className="item-text">
            {sphere && <span className="dot inline" style={{ background: sphere.color }} title={sphere.name} />}
            {text}
          </span>
        </div>
      )}
      {!editing && meta && <span className="item-meta">{meta}</span>}
    </div>
  )
}

function ItemEditor({
  initial,
  sphereId,
  onSphere,
  onSave,
  onCancel,
  onDelete,
  extra,
}: {
  extra?: ReactNode
  initial: string
  sphereId: string | null
  onSphere?: (id: string | null) => void
  onSave: (t: string) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLTextAreaElement>(null)
  const skipBlur = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (el) {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [])
  return (
    <div
      className="item-edit"
      onBlur={(e) => {
        // save only when focus leaves the whole editor
        if (!skipBlur.current && !e.currentTarget.contains(e.relatedTarget as Node | null)) onSave(value.trim())
      }}
    >
      <AutoTextarea
        ref={ref}
        value={value}
        onChange={setValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            skipBlur.current = true
            onSave(value.trim())
          } else if (e.key === 'Escape') {
            skipBlur.current = true
            onCancel()
          }
        }}
      />
      {extra}
      <div className="edit-tools">
        {onSphere && <SphereChips value={sphereId} onChange={onSphere} />}
        {onDelete && (
          <button
            className="icon-btn danger"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              skipBlur.current = true
              if (confirm('Удалить?')) onDelete()
              else onCancel()
            }}
            aria-label="Удалить"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * One-tap sphere picker. Buttons keep focus in the text field (preventDefault on pointerdown),
 * so picking a sphere doesn't close the editor.
 */
export function SphereChips({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const spheres = useStore((s) => s.spheres)
  if (spheres.length === 0) return null
  const chip = (id: string | null, name: string, color?: string) => (
    <button
      key={id ?? 'none'}
      type="button"
      className={'chip small' + (value === id ? ' active' : '')}
      style={value === id ? { background: color ?? 'var(--muted)', borderColor: color ?? 'var(--muted)', color: '#111' } : { borderColor: color }}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => onChange(id)}
    >
      {color && value !== id && <span className="dot" style={{ background: color }} />}
      {name}
    </button>
  )
  return (
    <div className="sphere-chips">
      {chip(null, 'Без сферы')}
      {spheres.map((sp) => chip(sp.id, sp.name, sp.color))}
    </div>
  )
}

/** Interval picker for routines: 1ч, 6ч, 1д … 7д. */
export function IntervalChips({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <div className="sphere-chips interval-chips">
      <span className="chips-label">Повтор</span>
      {INTERVALS.map((h) => (
        <button
          key={h}
          type="button"
          className={'chip small' + (value === h ? ' active filled' : '')}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onChange(h)}
        >
          {intervalLabel(h)}
        </button>
      ))}
    </div>
  )
}

export function SphereSelect({
  value,
  onChange,
  className,
}: {
  value: string | null
  onChange: (id: string | null) => void
  className?: string
}) {
  const spheres = useStore((s) => s.spheres)
  return (
    <select className={className} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">Без сферы</option>
      {spheres.map((sp) => (
        <option key={sp.id} value={sp.id}>
          {sp.name}
        </option>
      ))}
    </select>
  )
}

type AutoProps = {
  value: string
  onChange: (v: string) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>
  onBlur?: () => void
  placeholder?: string
}

/** Textarea that grows with its content; Enter is handled by the caller. */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, AutoProps>(function AutoTextarea(
  { value, onChange, onKeyDown, onBlur, placeholder },
  ref,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    const el = inner.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [value])
  return (
    <textarea
      ref={(el) => {
        inner.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      }}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  )
})

const ArchiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="5" rx="1" />
    <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" />
  </svg>
)

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
  </svg>
)
