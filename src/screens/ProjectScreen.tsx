import { STATUSES, useStore, type Status } from '../store'
import { navigate } from '../hooks'
import { AddItem } from '../components/AddItem'
import { AutoTextarea } from '../components/ItemRow'
import { TaskList } from '../components/TaskList'

export function ProjectScreen({ id }: { id: string }) {
  const s = useStore()
  const p = s.projects.find((x) => x.id === id)
  if (!p)
    return (
      <div className="page">
        <p>Проект не найден.</p>
        <button className="link-btn" onClick={() => navigate('projects')}>
          ← К проектам
        </button>
      </div>
    )
  return (
    <div className="page project-page">
      <div className="page-head">
        <button className="icon-btn" onClick={() => navigate('projects')} aria-label="Назад">
          ←
        </button>
        <input
          className="title-input"
          value={p.title}
          placeholder="Название"
          onChange={(e) => s.updateProject(p.id, { title: e.target.value })}
        />
      </div>
      <div className="row">
        <select value={p.status} onChange={(e) => s.updateProject(p.id, { status: e.target.value as Status })}>
          {STATUSES.map((st) => (
            <option key={st.id} value={st.id}>
              {st.title}
            </option>
          ))}
        </select>
        <select value={p.sphereId ?? ''} onChange={(e) => s.updateProject(p.id, { sphereId: e.target.value || null })}>
          <option value="">Без сферы</option>
          {s.spheres.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </select>
      </div>
      <div className="description">
        <AutoTextarea
          value={p.description}
          placeholder="Описание…"
          onChange={(v) => s.updateProject(p.id, { description: v })}
        />
      </div>
      <h3>Задачи</h3>
      <AddItem label="Новая задача" onAdd={(t) => s.addProjectTask(p.id, t)} />
      <TaskList
        tasks={p.tasks}
        onToggle={(tid) => s.toggleProjectTask(p.id, tid)}
        onSave={(tid, t) => s.updateProjectTask(p.id, tid, t)}
        onDelete={(tid) => s.deleteProjectTask(p.id, tid)}
        onReorder={(a, o, done) => s.reorderProjectTasks(p.id, a, o, done)}
      />
      <button
        className="link-btn danger"
        onClick={() => {
          if (confirm(`Удалить проект «${p.title}»?`)) {
            s.deleteProject(p.id)
            navigate('projects')
          }
        }}
      >
        Удалить проект
      </button>
    </div>
  )
}
