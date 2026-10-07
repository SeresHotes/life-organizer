import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../store'

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
  handle?: ReactNode
  badge?: ReactNode
}

/** One- or two-line item: checkbox, clamped text (tap to edit), drag handle. */
export function ItemRow({ text, done, toggleKind = 'check', onToggle, onSave, onDelete, sphereId, onSphere, handle, badge }: Props) {
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
      {!editing && handle}
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
}: {
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
  const spheres = useStore((s) => s.spheres)
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
        // save only when focus leaves the whole editor (not when moving to the sphere select)
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
      {onSphere && spheres.length > 0 && (
        <SphereSelect className="sphere-select" value={sphereId} onChange={onSphere} />
      )}
      {onDelete && (
        <button
          className="icon-btn danger"
          onPointerDown={() => (skipBlur.current = true)}
          onClick={() => {
            if (confirm('Удалить?')) onDelete()
            else onCancel()
          }}
          aria-label="Удалить"
        >
          🗑
        </button>
      )}
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
