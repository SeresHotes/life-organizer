import type { ReactNode } from 'react'
import { intervalLabel, routineReopenAt, shortLeft, useStore, type Note, type NoteKind, type Owner, type Routine, type Task } from '../store'
import { useRoutineDone } from '../hooks'
import { SortableList } from './SortableList'
import { IntervalChips, ItemRow } from './ItemRow'

type Show = 'open' | 'done' | 'all'

type ListProps<T> = {
  /** Main screen (null) or a project id. */
  owner?: Owner
  /** Optional extra filter, e.g. by sphere. */
  filter?: (x: T) => boolean
  show?: Show
}

const pass = () => true

/** A task of the main screen (owner=null) or of a project; `badge` marks project tasks shown elsewhere. */
export function TaskRow({ owner, task: t, badge }: { owner: Owner; task: Task; badge?: ReactNode }) {
  const s = useStore()
  return (
    <ItemRow
      text={t.text}
      done={t.done}
      badge={badge}
      sphereId={owner === null ? t.sphereId : null}
      onSphere={owner === null ? (sphereId) => s.updateTask(owner, t.id, { sphereId }) : undefined}
      onToggle={() => s.toggleTask(owner, t.id)}
      onSave={(text) => s.updateTask(owner, t.id, { text })}
      onDelete={() => s.deleteTask(owner, t.id)}
    />
  )
}

/** A routine; when done shows how long until it opens again. */
export function RoutineRow({ owner, routine: r, badge }: { owner: Owner; routine: Routine; badge?: ReactNode }) {
  const s = useStore()
  const { now, dayStartHour } = useRoutineDone()
  const reopenAt = routineReopenAt(r, dayStartHour)
  const done = reopenAt !== null && now < reopenAt
  return (
    <ItemRow
      text={r.text}
      done={done}
      badge={badge}
      meta={done ? shortLeft(reopenAt - now) : r.interval !== 24 ? '↻' + intervalLabel(r.interval) : null}
      editExtra={<IntervalChips value={r.interval} onChange={(interval) => s.updateRoutine(owner, r.id, { interval })} />}
      sphereId={owner === null ? r.sphereId : null}
      onSphere={owner === null ? (sphereId) => s.updateRoutine(owner, r.id, { sphereId }) : undefined}
      onToggle={() => s.toggleRoutine(owner, r.id)}
      onSave={(text) => s.updateRoutine(owner, r.id, { text })}
      onDelete={() => s.deleteRoutine(owner, r.id)}
    />
  )
}

/** Open tasks first, then closed ones; each part is sortable on its own. */
export function TaskList({
  owner = null,
  filter = pass,
  show = 'all',
  afterOpen,
}: ListProps<Task> & { afterOpen?: ReactNode }) {
  const s = useStore()
  const all = owner === null ? s.tasks : (s.projects.find((p) => p.id === owner)?.tasks ?? [])
  const tasks = all.filter(filter)
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const part = (items: Task[], isDone: boolean) => (
    <SortableList
      items={items}
      onReorder={(a, o) => s.reorderTasks(owner, a, o, isDone)}
      render={(t) => <TaskRow owner={owner} task={t} />}
    />
  )
  return (
    <>
      {show !== 'done' && part(open, false)}
      {afterOpen}
      {show === 'all' && done.length > 0 && <div className="divider">Выполнено · {done.length}</div>}
      {show !== 'open' && part(done, true)}
    </>
  )
}

/** Routines: open ones (sortable) first, then the done ones in completion order. */
export function RoutineList({ owner = null, filter = pass }: ListProps<Routine>) {
  const s = useStore()
  const { isDone } = useRoutineDone()
  const all = owner === null ? s.routines : (s.projects.find((p) => p.id === owner)?.routines ?? [])
  const routines = all.filter(filter)
  const open = routines.filter((r) => !isDone(r))
  const done = routines.filter(isDone).sort((a, b) => a.doneAt - b.doneAt)
  const row = (r: Routine) => <RoutineRow owner={owner} routine={r} />
  return (
    <>
      <SortableList items={open} onReorder={(a, o) => s.reorderRoutines(owner, a, o)} render={row} />
      <SortableList items={done} render={row} />
    </>
  )
}

/** Notes or thoughts: active ones, or archived ones (show='done'). */
export function NoteList({
  filter = pass,
  show = 'open',
  kind = 'note',
}: Omit<ListProps<Note>, 'owner'> & { kind?: NoteKind }) {
  const s = useStore()
  const archived = show === 'done'
  const notes = s.notes.filter((n) => n.kind === kind && n.archived === archived && filter(n))
  return (
    <SortableList
      items={notes}
      onReorder={(a, o) => s.reorderNotes(a, o, archived)}
      render={(n) => (
        <ItemRow
          text={n.text}
          done={n.archived}
          toggleKind="archive"
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
