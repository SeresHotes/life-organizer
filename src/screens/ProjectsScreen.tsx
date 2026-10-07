import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { STATUSES, isArchived, useStore, type Project, type Status } from '../store'
import { navigate } from '../hooks'
import { AddItem } from '../components/AddItem'

const isStatus = (id: unknown): id is Status => STATUSES.some((s) => s.id === id)

/** Prefer the card under the pointer, then the column under the pointer, then the nearest thing. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  if (hits.length) {
    const card = hits.find((h) => !isStatus(h.id))
    return [card ?? hits[0]]
  }
  return closestCorners(args)
}

export function ProjectsScreen() {
  const projects = useStore((s) => s.projects)
  const setProjects = useStore((s) => s.setProjects)
  const addProject = useStore((s) => s.addProject)
  const filter = useStore((s) => s.sphereFilter)
  const [draft, setDraft] = useState<Project[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const now = Date.now()
  const list = draft ?? projects
  const visible = (p: Project) => !isArchived(p, now) && (!filter || p.sphereId === filter)
  const archived = projects.filter((p) => isArchived(p, now))
  const statusOf = (id: unknown, arr: Project[]) => (isStatus(id) ? id : arr.find((p) => p.id === id)?.status)

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !draft) return
    const target = statusOf(over.id, draft)
    const item = draft.find((p) => p.id === active.id)
    if (!item || !target || item.status === target) return
    const rest = draft.filter((p) => p.id !== item.id)
    const moved = { ...item, status: target }
    let idx = rest.findIndex((p) => p.id === over.id)
    if (idx < 0) {
      // dropped on the column itself: put after the last project of that column
      const last = rest.map((p) => p.status).lastIndexOf(target)
      idx = last < 0 ? rest.length : last + 1
    }
    rest.splice(idx, 0, moved)
    setDraft(rest)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    let next = draft ?? projects
    if (over && !isStatus(over.id) && active.id !== over.id) {
      const from = next.findIndex((p) => p.id === active.id)
      const to = next.findIndex((p) => p.id === over.id)
      if (from >= 0 && to >= 0 && next[from].status === next[to].status) next = arrayMove(next, from, to)
    }
    const before = new Map(projects.map((p) => [p.id, p]))
    setProjects(
      next.map((p) => {
        const old = before.get(p.id)
        if (!old || old.status === p.status) return p
        return { ...p, doneAt: p.status === 'done' ? Date.now() : null }
      }),
    )
    setDraft(null)
    setActiveId(null)
  }

  const active = activeId ? list.find((p) => p.id === activeId) : undefined

  return (
    <div className="projects-screen">
      <SphereFilter />
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={({ active }) => {
          setDraft(projects)
          setActiveId(String(active.id))
        }}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setDraft(null)
          setActiveId(null)
        }}
      >
        <div className="board">
          {STATUSES.map((st) => {
            const items = list.filter((p) => p.status === st.id && visible(p))
            return (
              <Column key={st.id} status={st.id} title={st.title} items={items}>
                <AddItem label="Проект" onAdd={(t) => addProject(t, st.id, filter)} />
                {st.id === 'done' && archived.length > 0 && (
                  <button className="link-btn" onClick={() => setShowArchive(!showArchive)}>
                    {showArchive ? 'Скрыть архив' : `Архив · ${archived.length}`}
                  </button>
                )}
                {st.id === 'done' &&
                  showArchive &&
                  archived.map((p) => <Card key={p.id} project={p} archived />)}
              </Column>
            )
          })}
        </div>
        <DragOverlay>{active ? <Card project={active} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}

function SphereFilter() {
  const spheres = useStore((s) => s.spheres)
  const filter = useStore((s) => s.sphereFilter)
  const setFilter = useStore((s) => s.setSphereFilter)
  if (spheres.length === 0) return null
  return (
    <div className="chips">
      <button className={'chip' + (filter === null ? ' active' : '')} onClick={() => setFilter(null)}>
        Все
      </button>
      {spheres.map((sp) => (
        <button
          key={sp.id}
          className={'chip' + (filter === sp.id ? ' active' : '')}
          style={{ borderColor: sp.color }}
          onClick={() => setFilter(filter === sp.id ? null : sp.id)}
        >
          <span className="dot" style={{ background: sp.color }} />
          {sp.name}
        </button>
      ))}
    </div>
  )
}

function Column({
  status,
  title,
  items,
  children,
}: {
  status: Status
  title: string
  items: Project[]
  children?: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: status })
  return (
    <div className="column">
      <div className="column-head">
        <span>{title}</span>
        <span className="count">{items.length}</span>
      </div>
      <div className="column-body" ref={setNodeRef}>
        <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {items.map((p) => (
            <SortableCard key={p.id} project={p} />
          ))}
        </SortableContext>
        {children}
      </div>
    </div>
  )
}

function SortableCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes}
      {...listeners}
    >
      <Card project={project} />
    </div>
  )
}

export function Card({ project, overlay, archived }: { project: Project; overlay?: boolean; archived?: boolean }) {
  const sphere = useStore((s) => s.spheres.find((x) => x.id === project.sphereId))
  const next = project.tasks.find((t) => !t.done)
  const doneCount = project.tasks.filter((t) => t.done).length
  return (
    <div
      className={'card' + (overlay ? ' overlay' : '') + (archived ? ' archived' : '')}
      style={{ borderLeftColor: sphere?.color ?? 'transparent' }}
      onClick={() => navigate('project/' + project.id)}
    >
      <div className="card-title">{project.title}</div>
      {next && <div className="card-task">→ {next.text}</div>}
      <div className="card-meta">
        {sphere && <span>{sphere.name}</span>}
        {project.tasks.length > 0 && (
          <span>
            {doneCount}/{project.tasks.length}
          </span>
        )}
      </div>
    </div>
  )
}
