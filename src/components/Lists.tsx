import { useStore, type Note, type Owner, type Routine, type Task } from '../store'
import { useToday } from '../hooks'
import { SortableList } from './SortableList'
import { ItemRow } from './ItemRow'

type Show = 'open' | 'done' | 'all'

type ListProps<T> = {
  /** Main screen (null) or a project id. */
  owner?: Owner
  /** Optional extra filter, e.g. by sphere. */
  filter?: (x: T) => boolean
  show?: Show
}

const pass = () => true

/** Open tasks first, then closed ones; each part is sortable on its own. */
export function TaskList({ owner = null, filter = pass, show = 'all' }: ListProps<Task>) {
  const s = useStore()
  const all = owner === null ? s.tasks : (s.projects.find((p) => p.id === owner)?.tasks ?? [])
  const tasks = all.filter(filter)
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const part = (items: Task[], isDone: boolean) => (
    <SortableList
      items={items}
      onReorder={(a, o) => s.reorderTasks(owner, a, o, isDone)}
      render={(t, handle) => (
        <ItemRow
          text={t.text}
          done={t.done}
          handle={handle}
          sphereId={owner === null ? t.sphereId : null}
          onSphere={owner === null ? (sphereId) => s.updateTask(owner, t.id, { sphereId }) : undefined}
          onToggle={() => s.toggleTask(owner, t.id)}
          onSave={(text) => s.updateTask(owner, t.id, { text })}
          onDelete={() => s.deleteTask(owner, t.id)}
        />
      )}
    />
  )
  return (
    <>
      {show !== 'done' && part(open, false)}
      {show === 'all' && done.length > 0 && <div className="divider">Выполнено · {done.length}</div>}
      {show !== 'open' && part(done, true)}
    </>
  )
}

/** Routines: open ones (sortable) first, then the ones done today in completion order. */
export function RoutineList({ owner = null, filter = pass }: ListProps<Routine>) {
  const s = useStore()
  const today = useToday()
  const all = owner === null ? s.routines : (s.projects.find((p) => p.id === owner)?.routines ?? [])
  const routines = all.filter(filter)
  const open = routines.filter((r) => r.doneOn !== today)
  const done = routines.filter((r) => r.doneOn === today).sort((a, b) => a.doneAt - b.doneAt)
  const row = (r: Routine, handle: React.ReactNode) => (
    <ItemRow
      text={r.text}
      done={r.doneOn === today}
      handle={handle}
      sphereId={owner === null ? r.sphereId : null}
      onSphere={owner === null ? (sphereId) => s.updateRoutine(owner, r.id, { sphereId }) : undefined}
      onToggle={() => s.toggleRoutine(owner, r.id, today)}
      onSave={(text) => s.updateRoutine(owner, r.id, { text })}
      onDelete={() => s.deleteRoutine(owner, r.id)}
    />
  )
  return (
    <>
      <SortableList items={open} onReorder={(a, o) => s.reorderRoutines(owner, a, o, today)} render={row} />
      <SortableList items={done} render={row} />
    </>
  )
}

/** Notes: active ones, or archived ones (show='done'). */
export function NoteList({ filter = pass, show = 'open' }: Omit<ListProps<Note>, 'owner'>) {
  const s = useStore()
  const archived = show === 'done'
  const notes = s.notes.filter((n) => n.archived === archived && filter(n))
  return (
    <SortableList
      items={notes}
      onReorder={(a, o) => s.reorderNotes(a, o, archived)}
      render={(n, handle) => (
        <ItemRow
          text={n.text}
          done={n.archived}
          toggleKind="archive"
          handle={handle}
          sphereId={n.sphereId}
          onSphere={(sphereId) => s.updateNote(n.id, { sphereId })}
          onToggle={() => s.toggleNoteArchived(n.id)}
          onSave={(text) => s.updateNote(n.id, { text })}
          onDelete={() => s.deleteNote(n.id)}
        />
      )}
    />
  )
}
