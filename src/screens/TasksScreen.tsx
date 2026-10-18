import { ON_MAIN_SCREEN, moveKey, sortByOrder, useStore, type Project, type Routine, type Task } from '../store'
import { useRoutineDone } from '../hooks'
import { Section } from '../components/Section'
import { SortableList } from '../components/SortableList'
import { AddForm } from '../components/AddItem'
import { ProjectBadge, RoutineRow, TaskList, TaskRow } from '../components/Lists'

/** All tasks and routines: own ones plus those of active projects. */
export function TasksScreen() {
  return (
    <div className="main-screen">
      <Tasks />
      <Routines />
    </div>
  )
}

function Routines() {
  const s = useStore()
  const { isDone } = useRoutineDone()
  // own routines and routines of active projects form one list, ordered by mainOrder
  type Entry = { id: string; owner: string | null; routine: Routine; project?: Project }
  const all: Entry[] = [
    ...s.projects
      .filter((p) => ON_MAIN_SCREEN.includes(p.status))
      .flatMap((p) => p.routines.map((r) => ({ id: r.id, owner: p.id, routine: r, project: p }))),
    ...s.routines.map((r) => ({ id: r.id, owner: null, routine: r })),
  ]
  const open = sortByOrder(
    all.filter((e) => !isDone(e.routine)),
    s.mainOrder.routines,
  )
  const done = all.filter((e) => isDone(e.routine)).sort((a, b) => a.routine.doneAt - b.routine.doneAt)
  const row = (e: Entry) => (
    <RoutineRow
      owner={e.owner}
      routine={e.routine}
      badge={e.project && <ProjectBadge project={e.project} />}
    />
  )
  return (
    <Section
      group="tasks"
      id="routines"
      title="Рутина"
      count={open.length}
      add={(close) => (
        <AddForm
          label="Новая рутина"
          withSphere
          withInterval
          onAdd={(t, sp, interval) => s.addRoutine(null, t, sp, interval)}
          onClose={close}
        />
      )}
    >
      <SortableList
        items={open}
        onReorder={(a, o) => s.setMainOrder('routines', moveKey(open.map((e) => e.id), a, o))}
        render={row}
      />
      <SortableList items={done} render={row} />
    </Section>
  )
}

function Tasks() {
  const s = useStore()
  // own open tasks and one slot per active project (its first open task), ordered by mainOrder
  type Entry = { id: string; owner: string | null; task: Task; project?: Project }
  const projectEntries: Entry[] = s.projects
    .filter((p) => ON_MAIN_SCREEN.includes(p.status))
    .flatMap((p) => {
      const t = p.tasks.find((x) => !x.done)
      return t ? [{ id: 'project:' + p.id, owner: p.id, task: t, project: p }] : []
    })
  const ownEntries: Entry[] = s.tasks.filter((t) => !t.done).map((t) => ({ id: t.id, owner: null, task: t }))
  const open = sortByOrder([...projectEntries, ...ownEntries], s.mainOrder.tasks)
  const done = s.tasks.filter((t) => t.done)
  return (
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
        render={(e) => (
          <TaskRow owner={e.owner} task={e.task} badge={e.project && <ProjectBadge project={e.project} />} />
        )}
      />
      {done.length > 0 && <div className="divider">Выполнено · {done.length}</div>}
      <TaskList show="done" />
      {done.length > 0 && (
        <button className="link-btn" onClick={() => confirm('Удалить все выполненные задачи?') && s.clearDoneTasks()}>
          Очистить выполненные
        </button>
      )}
    </Section>
  )
}
