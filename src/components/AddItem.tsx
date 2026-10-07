import { useRef, useState } from 'react'
import { AutoTextarea } from './ItemRow'

/** "+ New ..." button that turns into an input; Enter adds and keeps the input open for the next item. */
export function AddItem({ label, onAdd }: { label: string; onAdd: (text: string) => void }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const submit = () => {
    const t = value.trim()
    if (t) onAdd(t)
    setValue('')
  }
  if (!open)
    return (
      <button className="add-btn" onClick={() => setOpen(true)}>
        + {label}
      </button>
    )
  return (
    <div className="item item-edit add-edit">
      <AutoTextarea
        ref={(el) => {
          ref.current = el
          el?.focus()
        }}
        value={value}
        placeholder={label}
        onChange={setValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') {
            setValue('')
            setOpen(false)
          }
        }}
        onBlur={() => {
          submit()
          setOpen(false)
        }}
      />
    </div>
  )
}
