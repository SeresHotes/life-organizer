import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  text: string
  done?: boolean
  onToggle?: () => void
  onSave: (text: string) => void
  onDelete?: () => void
  handle?: ReactNode
  badge?: ReactNode
}

/** One- or two-line item: checkbox, clamped text (tap to edit), drag handle. */
export function ItemRow({ text, done, onToggle, onSave, onDelete, handle, badge }: Props) {
  const [editing, setEditing] = useState(false)
  return (
    <div className={'item' + (done ? ' done' : '')}>
      {onToggle && (
        <button className={'check' + (done ? ' checked' : '')} onClick={onToggle} aria-label={done ? 'Открыть' : 'Выполнить'}>
          {done ? '✓' : ''}
        </button>
      )}
      {editing ? (
        <ItemEditor
          initial={text}
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
          <span className="item-text">{text}</span>
        </div>
      )}
      {!editing && handle}
    </div>
  )
}

function ItemEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: string
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
    <div className="item-edit">
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
        onBlur={() => !skipBlur.current && onSave(value.trim())}
      />
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
