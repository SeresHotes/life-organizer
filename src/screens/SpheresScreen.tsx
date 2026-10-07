import { useState } from 'react'
import { STATUSES, isArchived, useStore, type Sphere } from '../store'
import { navigate, useRoutineDone } from '../hooks'
import { AddItem } from '../components/AddItem'
import { NoteList, RoutineList, TaskList } from '../components/Lists'
import { Card } from './ProjectsScreen'

const PALETTE = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e', '#bb9af7', '#7dcfff', '#ff9e64', '#c0caf5']

export function SpheresScreen() {
  const s = useStore()
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>Сферы жизни</h2>
      <div className="sphere-grid">
        {s.spheres.map((sp) => (
          <SphereTile key={sp.id} sphere={sp} />
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          s.addSphere(name.trim(), PALETTE[s.spheres.length % PALETTE.length])
          setName('')
        }}
      >
        <input value={name} placeholder="Новая сфера (здоровье, работа…)" onChange={(e) => setName(e.target.value)} />
        <button type="submit">Добавить</button>
      </form>
    </div>
  )
}

function SphereTile({ sphere }: { sphere: Sphere }) {
  const s = useStore()
  const { isDone } = useRoutineDone()
  const mine = <T extends { sphereId: string | null }>(x: T) => x.sphereId === sphere.id
  const projects = s.projects.filter((p) => mine(p) && p.status !== 'done').length
  const tasks = s.tasks.filter((t) => mine(t) && !t.done).length
  const notes = s.notes.filter((n) => mine(n) && !n.archived).length
  const routines = s.routines.filter((r) => mine(r) && !isDone(r)).length
  return (
    <button className="sphere-tile" style={{ borderLeftColor: sphere.color }} onClick={() => navigate('sphere/' + sphere.id)}>
      <div className="card-title">{sphere.name}</div>
      <div className="card-meta">
        <span>Проекты {projects}</span>
        <span>Задачи {tasks}</span>
        <span>Рутина {routines}</span>
        <span>Заметки {notes}</span>
      </div>
    </button>
  )
}

export function SphereScreen({ id }: { id: string }) {
  const s = useStore()
  const [showDone, setShowDone] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const sphere = s.spheres.find((x) => x.id === id)
  if (!sphere)
    return (
      <div className="page">
        <p>Сфера не найдена.</p>
        <button className="link-btn" onClick={() => navigate('spheres')}>
          ← К сферам
        </button>
      </div>
    )
  const now = Date.now()
  const mine = <T extends { sphereId: string | null }>(x: T) => x.sphereId === id
  const projects = s.projects.filter(mine)
  const active = projects.filter((p) => p.status !== 'done')
  const doneProjects = projects.filter((p) => p.status === 'done' && !isArchived(p, now))
  const archivedProjects = projects.filter((p) => isArchived(p, now))
  const doneTasks = s.tasks.filter((t) => mine(t) && t.done).length
  const archivedNotes = s.notes.filter((n) => mine(n) && n.archived).length

  return (
    <div className="page sphere-page">
      <div className="page-head">
        <button className="icon-btn" onClick={() => navigate('spheres')} aria-label="Назад">
          ←
        </button>
        <input
          type="color"
          className="color-input"
          value={sphere.color}
          onChange={(e) => s.updateSphere(id, { color: e.target.value })}
        />
        <input className="title-input" value={sphere.name} onChange={(e) => s.updateSphere(id, { name: e.target.value })} />
      </div>

      <h3>Проекты</h3>
      <AddItem label="Новый проект" onAdd={(t) => s.addProject(t, 'open', id)} />
      {STATUSES.filter((st) => st.id !== 'done').map((st) => {
        const items = active.filter((p) => p.status === st.id)
        if (items.length === 0) return null
        return (
          <div key={st.id} className="status-group">
            <div className="divider">{st.title}</div>
            <div className="cards">
              {items.map((p) => (
                <Card key={p.id} project={p} />
              ))}
            </div>
          </div>
        )
      })}

      <h3>Задачи</h3>
      <AddItem label="Новая задача" onAdd={(t) => s.addTask(null, t, id)} />
      <TaskList filter={mine} show="open" />

      <h3>Рутина</h3>
      <AddItem label="Новая рутина" withInterval onAdd={(t, _, interval) => s.addRoutine(null, t, id, interval)} />
      <RoutineList filter={mine} />

      <h3>Заметки</h3>
      <AddItem label="Новая заметка" onAdd={(t) => s.addNote(t, id)} />
      <NoteList filter={mine} />

      <button className="link-btn block" onClick={() => setShowDone(!showDone)}>
        {showDone ? '▾' : '▸'} Завершённое · {doneTasks + doneProjects.length}
      </button>
      {showDone && (
        <>
          <div className="cards">
            {doneProjects.map((p) => (
              <Card key={p.id} project={p} />
            ))}
          </div>
          <TaskList filter={mine} show="done" />
        </>
      )}

      <button className="link-btn block" onClick={() => setShowArchive(!showArchive)}>
        {showArchive ? '▾' : '▸'} Архив · {archivedNotes + archivedProjects.length}
      </button>
      {showArchive && (
        <>
          <div className="cards">
            {archivedProjects.map((p) => (
              <Card key={p.id} project={p} archived />
            ))}
          </div>
          <NoteList filter={mine} show="done" />
        </>
      )}

      <button
        className="link-btn danger block"
        onClick={() => {
          if (confirm(`Удалить сферу «${sphere.name}»? Элементы останутся, но без сферы.`)) {
            s.deleteSphere(id)
            navigate('spheres')
          }
        }}
      >
        Удалить сферу
      </button>
    </div>
  )
}
