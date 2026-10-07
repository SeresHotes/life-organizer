import { useState } from 'react'
import { ON_MAIN_SCREEN, moveKey, sortByOrder, useStore, type Project, type Routine, type Task } from '../store'
import { useToday, navigate } from '../hooks'
import { Section } from '../components/Section'
import { SortableList } from '../components/SortableList'
import { AddItem } from '../components/AddItem'
import { NoteList, RoutineRow, TaskList, TaskRow } from '../components/Lists'

export function MainScreen() {
  return (
    <div className="main-screen">
      <Notes />
      <Routines />
      <Tasks />
    </div>
  )
}

/** Small project label shown on project items; tapping it opens the project. */
export function ProjectBadge({ project }: { project: Project }) {
  const color = useStore((s) => s.spheres.find((x) => x.id === project.sphereId)?.color)
  return (
    <span
      className="badge"
      style={{ borderColor: color }}
      onClick={(e) => {
        e.stopPropagation()
        navigate('project/' + project.id)
      }}
    >
      {project.title}
    </span>
  )
}

function Notes() {
  const s = useStore()
  const [showArchive, setShowArchive] = useState(false)
  const open = s.notes.filter((n) => !n.archived).length
  const archived = s.notes.length - open
  return (
    <Section id="notes" title="Заметки" count={open}>
      <AddItem label="Новая заметка" withSphere onAdd={(t, sp) => s.addNote(t, sp)} />
      <NoteList />
      {archived > 0 && (
        <button className="link-btn" onClick={() => setShowArchive(!showArchive)}>
          {showArchive ? 'Скрыть архив' : `Архив · ${archived}`}
        </button>
      )}
      {showArchive && <NoteList show="done" />}
    </Section>
  )
}

function Routines() {
  const s = useStore()
  const today = useToday()
  // own routines and routines of active projects form one list, ordered by mainOrder
  type Entry = { id: string; owner: string | null; routine: Routine; project?: Project }
  const all: Entry[] = [
    ...s.projects
      .filter((p) => ON_MAIN_SCREEN.includes(p.status))
      .flatMap((p) => p.routines.map((r) => ({ id: r.id, owner: p.id, routine: r, project: p }))),
    ...s.routines.map((r) => ({ id: r.id, owner: null, routine: r })),
  ]
  const open = sortByOrder(
    all.filter((e) => e.routine.doneOn !== today),
    s.mainOrder.routines,
  )
  const done = all.filter((e) => e.routine.doneOn === today).sort((a, b) => a.routine.doneAt - b.routine.doneAt)
  const row = (e: Entry) => (
    <RoutineRow
      owner={e.owner}
      routine={e.routine}
      today={today}
      badge={e.project && <ProjectBadge project={e.project} />}
    />
  )
  return (
    <Section id="routines" title="Рутина" count={open.length}>
      <AddItem label="Новая рутина" withSphere onAdd={(t, sp) => s.addRoutine(null, t, sp)} />
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
    <Section id="tasks" title="Задачи" count={open.length}>
      <AddItem label="Новая задача" withSphere onAdd={(t, sp) => s.addTask(null, t, sp)} />
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
