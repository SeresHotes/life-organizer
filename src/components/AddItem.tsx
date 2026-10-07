import { useEffect, useRef, useState } from 'react'
import { AutoTextarea, SphereChips } from './ItemRow'

type Props = {
  label: string
  onAdd: (text: string, sphereId: string | null) => void
  /** Show a sphere picker for the new item. */
  withSphere?: boolean
}

/** "+ New ..." button that turns into an input; Enter adds and keeps the input open for the next item. */
export function AddItem({ label, onAdd, withSphere }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [sphereId, setSphereId] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])
  const submit = () => {
    const t = value.trim()
    if (t) onAdd(t, sphereId)
    setValue('')
  }
  const close = () => {
    setOpen(false)
    setSphereId(null)
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
        ref={ref}
        value={value}
        placeholder={label}
        onChange={setValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') {
            setValue('')
            close()
          }
        }}
        onBlur={() => {
          submit()
          close()
        }}
      />
      {withSphere && (
        <div className="edit-tools">
          <SphereChips value={sphereId} onChange={setSphereId} />
        </div>
      )}
    </div>
  )
}
