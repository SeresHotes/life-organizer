import { ON_MAIN_SCREEN, moveKey, sortByOrder, taskOrder, useStore, type Project, type Routine, type Task } from '../store'
import { useRoutineDone } from '../hooks'
import { Section } from '../components/Section'
import { SortableList } from '../components/SortableList'
import { AddForm } from '../components/AddItem'
import { ProjectBadge, RoutineRow, TaskList, TaskRow } from '../components/Lists'

/**
 * All tasks in one list, routines among them: own ones, one slot per active project (its first open task)
 * and routines of active projects. Ordered by mainOrder.tasks.
 */
export function TasksScreen() {
  const s = useStore()
  const { isDone } = useRoutineDone()
  type Entry = { id: string; owner: string | null; project?: Project } & (
    | { kind: 'task'; task: Task }
    | { kind: 'routine'; routine: Routine }
  )
  const active = s.projects.filter((p) => ON_MAIN_SCREEN.includes(p.status))
  const entries: Entry[] = [
    ...active.flatMap((p): Entry[] => {
      const t = p.tasks.find((x) => !x.done)
      return t ? [{ id: 'project:' + p.id, kind: 'task', owner: p.id, task: t, project: p }] : []
    }),
    ...s.tasks.filter((t) => !t.done).map((t): Entry => ({ id: t.id, kind: 'task', owner: null, task: t })),
    ...active.flatMap((p) =>
      p.routines.map((r): Entry => ({ id: r.id, kind: 'routine', owner: p.id, routine: r, project: p })),
    ),
    ...s.routines.map((r): Entry => ({ id: r.id, kind: 'routine', owner: null, routine: r })),
  ]
  const waiting = (e: Entry) => e.kind === 'routine' && isDone(e.routine)
  const open = sortByOrder(
    entries.filter((e) => !waiting(e)),
    taskOrder(s.mainOrder),
  )
  // routines that are done wait at the bottom until they open again
  const resting = entries
    .filter(waiting)
    .sort((a, b) => (a.kind === 'routine' && b.kind === 'routine' ? a.routine.doneAt - b.routine.doneAt : 0))
  const done = s.tasks.filter((t) => t.done)
  const row = (e: Entry) => {
    const badge = e.project && <ProjectBadge project={e.project} />
    return e.kind === 'task' ? (
      <TaskRow owner={e.owner} task={e.task} badge={badge} />
    ) : (
      <RoutineRow owner={e.owner} routine={e.routine} badge={badge} />
    )
  }
  return (
    <div className="main-screen">
      <Section
        group="tasks"
        id="tasks"
        defaultExpanded
        title="Задачи"
        count={open.length}
        add={(close) => (
          <AddForm
            label="Новая задача"
            withSphere
            withInterval="optional"
            onAdd={(t, sp, interval) => (interval ? s.addRoutine(null, t, sp, interval) : s.addTask(null, t, sp))}
            onClose={close}
          />
        )}
      >
        <SortableList
          items={open}
          onReorder={(a, o) => s.setMainOrder('tasks', moveKey(open.map((e) => e.id), a, o))}
          render={row}
        />
        <SortableList items={resting} render={row} />
        {done.length > 0 && <div className="divider">Выполнено · {done.length}</div>}
        <TaskList show="done" />
        {done.length > 0 && (
          <button className="link-btn" onClick={() => confirm('Удалить все выполненные задачи?') && s.clearDoneTasks()}>
            Очистить выполненные
          </button>
        )}
      </Section>
    </div>
  )
}
