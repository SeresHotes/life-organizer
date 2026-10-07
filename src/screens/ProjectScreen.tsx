import { STATUSES, useStore, type Status } from '../store'
import { navigate } from '../hooks'
import { AddItem } from '../components/AddItem'
import { AutoTextarea, SphereSelect } from '../components/ItemRow'
import { RoutineList, TaskList } from '../components/Lists'

export function ProjectScreen({ id }: { id: string }) {
  const s = useStore()
  const p = s.projects.find((x) => x.id === id)
  const back = () => (history.length > 1 ? history.back() : navigate('projects'))
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
        <button className="icon-btn" onClick={back} aria-label="Назад">
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
        <SphereSelect value={p.sphereId} onChange={(sphereId) => s.updateProject(p.id, { sphereId })} />
      </div>
      <div className="description">
        <AutoTextarea
          value={p.description}
          placeholder="Описание…"
          onChange={(v) => s.updateProject(p.id, { description: v })}
        />
      </div>
      <h3>Задачи</h3>
      <AddItem label="Новая задача" onAdd={(t) => s.addTask(p.id, t)} />
      <TaskList owner={p.id} />
      <h3>Рутина</h3>
      <AddItem label="Новая рутина" onAdd={(t) => s.addRoutine(p.id, t)} />
      <RoutineList owner={p.id} />
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
