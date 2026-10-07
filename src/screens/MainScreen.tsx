import { useState } from 'react'
import { useStore, type Project } from '../store'
import { useToday, navigate } from '../hooks'
import { Section } from '../components/Section'
import { ItemRow } from '../components/ItemRow'
import { AddItem } from '../components/AddItem'
import { NoteList, RoutineList, TaskList } from '../components/Lists'

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
      <AddItem label="Новая заметка" onAdd={(t) => s.addNote(t)} />
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
  // routines of projects in progress are shown here too
  const projectRoutines = s.projects
    .filter((p) => p.status === 'progress')
    .flatMap((p) => p.routines.map((r) => ({ project: p, routine: r })))
  const projectOpen = projectRoutines.filter(({ routine: r }) => r.doneOn !== today)
  const projectDone = projectRoutines.filter(({ routine: r }) => r.doneOn === today)
  const open = s.routines.filter((r) => r.doneOn !== today).length + projectOpen.length
  const projectRow = ({ project, routine: r }: (typeof projectRoutines)[number]) => (
    <ItemRow
      key={r.id}
      text={r.text}
      done={r.doneOn === today}
      badge={<ProjectBadge project={project} />}
      onToggle={() => s.toggleRoutine(project.id, r.id, today)}
      onSave={(text) => s.updateRoutine(project.id, r.id, { text })}
      onDelete={() => s.deleteRoutine(project.id, r.id)}
    />
  )
  return (
    <Section id="routines" title="Рутина" count={open}>
      <AddItem label="Новая рутина" onAdd={(t) => s.addRoutine(null, t)} />
      {projectOpen.map(projectRow)}
      <RoutineList />
      {projectDone.map(projectRow)}
    </Section>
  )
}

function Tasks() {
  const s = useStore()
  const projectTasks = s.projects
    .filter((p) => p.status === 'progress')
    .flatMap((p) => {
      const t = p.tasks.find((x) => !x.done)
      return t ? [{ project: p, task: t }] : []
    })
  const open = s.tasks.filter((t) => !t.done)
  const done = s.tasks.filter((t) => t.done)
  return (
    <Section id="tasks" title="Задачи" count={open.length + projectTasks.length}>
      <AddItem label="Новая задача" onAdd={(t) => s.addTask(null, t)} />
      {projectTasks.map(({ project, task }) => (
        <ItemRow
          key={task.id}
          text={task.text}
          badge={<ProjectBadge project={project} />}
          onToggle={() => s.toggleTask(project.id, task.id)}
          onSave={(text) => s.updateTask(project.id, task.id, { text })}
          onDelete={() => s.deleteTask(project.id, task.id)}
        />
      ))}
      <TaskList />
      {done.length > 0 && (
        <button className="link-btn" onClick={() => confirm('Удалить все выполненные задачи?') && s.clearDoneTasks()}>
          Очистить выполненные
        </button>
      )}
    </Section>
  )
}
