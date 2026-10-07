import { useStore } from '../store'
import { useToday, navigate } from '../hooks'
import { Section } from '../components/Section'
import { SortableList } from '../components/SortableList'
import { ItemRow } from '../components/ItemRow'
import { AddItem } from '../components/AddItem'
import { TaskList } from '../components/TaskList'

export function MainScreen() {
  return (
    <div className="main-screen">
      <Notes />
      <Routines />
      <Tasks />
    </div>
  )
}

function Notes() {
  const s = useStore()
  return (
    <Section id="notes" title="Заметки" count={s.notes.length}>
      <AddItem label="Новая заметка" onAdd={s.addNote} />
      <SortableList
        items={s.notes}
        onReorder={s.reorderNotes}
        render={(n, handle) => (
          <ItemRow text={n.text} handle={handle} onSave={(t) => s.updateNote(n.id, t)} onDelete={() => s.deleteNote(n.id)} />
        )}
      />
    </Section>
  )
}

function Routines() {
  const s = useStore()
  const today = useToday()
  const open = s.routines.filter((r) => r.doneOn !== today)
  const done = s.routines.filter((r) => r.doneOn === today).sort((a, b) => a.doneAt - b.doneAt)
  const row = (r: (typeof s.routines)[number], handle: React.ReactNode) => (
    <ItemRow
      text={r.text}
      done={r.doneOn === today}
      handle={handle}
      onToggle={() => s.toggleRoutine(r.id, today)}
      onSave={(t) => s.updateRoutine(r.id, t)}
      onDelete={() => s.deleteRoutine(r.id)}
    />
  )
  return (
    <Section id="routines" title="Рутина" count={open.length}>
      <AddItem label="Новая рутина" onAdd={s.addRoutine} />
      <SortableList items={open} onReorder={(a, o) => s.reorderRoutines(a, o, today)} render={row} />
      <SortableList items={done} render={row} />
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
  const sphereColor = (id: string | null) => s.spheres.find((x) => x.id === id)?.color
  return (
    <Section id="tasks" title="Задачи" count={open.length + projectTasks.length}>
      <AddItem label="Новая задача" onAdd={s.addTask} />
      {projectTasks.map(({ project, task }) => (
        <ItemRow
          key={task.id}
          text={task.text}
          badge={
            <span
              className="badge"
              style={{ borderColor: sphereColor(project.sphereId) }}
              onClick={(e) => {
                e.stopPropagation()
                navigate('project/' + project.id)
              }}
            >
              {project.title}
            </span>
          }
          onToggle={() => s.toggleProjectTask(project.id, task.id)}
          onSave={(t) => s.updateProjectTask(project.id, task.id, t)}
          onDelete={() => s.deleteProjectTask(project.id, task.id)}
        />
      ))}
      <TaskList
        tasks={s.tasks}
        onToggle={s.toggleTask}
        onSave={s.updateTask}
        onDelete={s.deleteTask}
        onReorder={s.reorderTasks}
      />
      {done.length > 0 && (
        <button className="link-btn" onClick={() => confirm('Удалить все выполненные задачи?') && s.clearDoneTasks()}>
          Очистить выполненные
        </button>
      )}
    </Section>
  )
}
