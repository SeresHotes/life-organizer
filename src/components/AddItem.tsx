import { useLayoutEffect, useRef, useState } from 'react'
import { AutoTextarea, IntervalChips, SphereChips } from './ItemRow'

type FormProps = {
  label: string
  onAdd: (text: string, sphereId: string | null, interval: number) => void
  /** Show a sphere picker for the new item. */
  withSphere?: boolean
  /** Show a repeat interval picker (routines). */
  withInterval?: boolean
  /** Sphere preselected in the picker. */
  defaultSphere?: string | null
  onClose: () => void
}

/** Input for new items; Enter adds and keeps the input open for the next one, Esc / leaving closes it. */
export function AddForm({ label, onAdd, withSphere, withInterval, defaultSphere = null, onClose }: FormProps) {
  const [value, setValue] = useState('')
  const [sphereId, setSphereId] = useState<string | null>(defaultSphere)
  const [interval, setInterval] = useState(24)
  const ref = useRef<HTMLTextAreaElement>(null)
  // layout effect runs in the same tap handler, so mobile browsers open the keyboard
  useLayoutEffect(() => ref.current?.focus(), [])
  const submit = () => {
    const t = value.trim()
    if (t) onAdd(t, sphereId, interval)
    setValue('')
  }
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
            onClose()
          }
        }}
        onBlur={() => {
          submit()
          onClose()
        }}
      />
      {withInterval && <IntervalChips value={interval} onChange={setInterval} />}
      {withSphere && (
        <div className="edit-tools">
          <SphereChips value={sphereId} onChange={setSphereId} />
        </div>
      )}
    </div>
  )
}

/** "+ New ..." button that turns into an AddForm. */
export function AddItem(props: Omit<FormProps, 'onClose'>) {
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <button className="add-btn" onClick={() => setOpen(true)}>
        + {props.label}
      </button>
    )
  return <AddForm {...props} onClose={() => setOpen(false)} />
}
