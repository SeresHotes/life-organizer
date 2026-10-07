import type { Task } from '../store'
import { SortableList } from './SortableList'
import { ItemRow } from './ItemRow'

type Props = {
  tasks: Task[]
  onToggle: (id: string) => void
  onSave: (id: string, text: string) => void
  onDelete: (id: string) => void
  onReorder: (activeId: string, overId: string, done: boolean) => void
}

/** Open tasks first, then closed ones; each part is sortable on its own. */
export function TaskList({ tasks, onToggle, onSave, onDelete, onReorder }: Props) {
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const part = (items: Task[], isDone: boolean) => (
    <SortableList
      items={items}
      onReorder={(a, o) => onReorder(a, o, isDone)}
      render={(t, handle) => (
        <ItemRow
          text={t.text}
          done={t.done}
          handle={handle}
          onToggle={() => onToggle(t.id)}
          onSave={(x) => onSave(t.id, x)}
          onDelete={() => onDelete(t.id)}
        />
      )}
    />
  )
  return (
    <>
      {part(open, false)}
      {done.length > 0 && <div className="divider">Выполнено · {done.length}</div>}
      {part(done, true)}
    </>
  )
}
