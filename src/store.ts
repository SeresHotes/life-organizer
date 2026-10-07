import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Task = { id: string; text: string; done: boolean }
export type Note = { id: string; text: string }
export type Routine = { id: string; text: string; doneOn: string | null; doneAt: number }
export type Status = 'open' | 'backlog' | 'progress' | 'waiting' | 'done'
export type Sphere = { id: string; name: string; color: string }
export type Project = {
  id: string
  title: string
  description: string
  status: Status
  sphereId: string | null
  tasks: Task[]
  createdAt: number
  doneAt: number | null
}

export const STATUSES: { id: Status; title: string }[] = [
  { id: 'open', title: 'Открытые' },
  { id: 'backlog', title: 'Бэклог' },
  { id: 'progress', title: 'В процессе' },
  { id: 'waiting', title: 'Ожидание' },
  { id: 'done', title: 'Готово' },
]

export const ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000

export const isArchived = (p: Project, now = Date.now()) =>
  p.status === 'done' && p.doneAt !== null && now - p.doneAt > ARCHIVE_AFTER_MS

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

/** Date key (YYYY-MM-DD) of the "logical" day; the day starts at `dayStartHour`. */
export function dayKey(dayStartHour: number, now = new Date()) {
  const d = new Date(now.getTime() - dayStartHour * 60 * 60 * 1000)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Moves item to the end of the array (so it lands at the end of its open/closed section). */
function moveToEnd<T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] {
  const item = arr.find((x) => x.id === id)
  if (!item) return arr
  return [...arr.filter((x) => x.id !== id), { ...item, ...patch }]
}

/** Reorders items inside one section (items matching `inSection`), keeping other items in place. */
export function reorderWithin<T extends { id: string }>(
  arr: T[],
  inSection: (x: T) => boolean,
  activeId: string,
  overId: string,
): T[] {
  const section = arr.filter(inSection)
  const from = section.findIndex((x) => x.id === activeId)
  const to = section.findIndex((x) => x.id === overId)
  if (from < 0 || to < 0 || from === to) return arr
  const moved = [...section]
  const [item] = moved.splice(from, 1)
  moved.splice(to, 0, item)
  let i = 0
  return arr.map((x) => (inSection(x) ? moved[i++] : x))
}

export type Data = {
  notes: Note[]
  routines: Routine[]
  tasks: Task[]
  projects: Project[]
  spheres: Sphere[]
  dayStartHour: number
}

type UI = {
  collapsed: Record<string, boolean>
  sphereFilter: string | null
}

type Actions = {
  // notes
  addNote: (text: string) => void
  updateNote: (id: string, text: string) => void
  deleteNote: (id: string) => void
  reorderNotes: (activeId: string, overId: string) => void
  // routines
  addRoutine: (text: string) => void
  updateRoutine: (id: string, text: string) => void
  deleteRoutine: (id: string) => void
  toggleRoutine: (id: string, today: string) => void
  reorderRoutines: (activeId: string, overId: string, today: string) => void
  // tasks (main screen)
  addTask: (text: string) => void
  updateTask: (id: string, text: string) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  reorderTasks: (activeId: string, overId: string, done: boolean) => void
  clearDoneTasks: () => void
  // projects
  addProject: (title: string, status: Status) => string
  updateProject: (id: string, patch: Partial<Omit<Project, 'id' | 'tasks'>>) => void
  deleteProject: (id: string) => void
  setProjects: (projects: Project[]) => void
  addProjectTask: (pid: string, text: string) => void
  updateProjectTask: (pid: string, id: string, text: string) => void
  deleteProjectTask: (pid: string, id: string) => void
  toggleProjectTask: (pid: string, id: string) => void
  reorderProjectTasks: (pid: string, activeId: string, overId: string, done: boolean) => void
  // spheres
  addSphere: (name: string, color: string) => void
  updateSphere: (id: string, patch: Partial<Omit<Sphere, 'id'>>) => void
  deleteSphere: (id: string) => void
  // misc
  setDayStartHour: (h: number) => void
  toggleCollapsed: (key: string) => void
  setSphereFilter: (id: string | null) => void
  importData: (data: Data) => void
}

export type State = Data & UI & Actions

const initialData: Data = {
  notes: [],
  routines: [],
  tasks: [],
  projects: [],
  spheres: [],
  dayStartHour: 4,
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const mapProject = (pid: string, fn: (p: Project) => Project) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === pid ? fn(p) : p)) }))

      return {
        ...initialData,
        collapsed: {},
        sphereFilter: null,

        addNote: (text) => set((s) => ({ notes: [{ id: uid(), text }, ...s.notes] })),
        updateNote: (id, text) => set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, text } : n)) })),
        deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
        reorderNotes: (a, o) => set((s) => ({ notes: reorderWithin(s.notes, () => true, a, o) })),

        addRoutine: (text) =>
          set((s) => ({ routines: [{ id: uid(), text, doneOn: null, doneAt: 0 }, ...s.routines] })),
        updateRoutine: (id, text) =>
          set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, text } : r)) })),
        deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
        toggleRoutine: (id, today) =>
          set((s) => ({
            routines: s.routines.map((r) =>
              r.id !== id ? r : r.doneOn === today ? { ...r, doneOn: null } : { ...r, doneOn: today, doneAt: Date.now() },
            ),
          })),
        reorderRoutines: (a, o, today) =>
          set((s) => ({ routines: reorderWithin(s.routines, (r) => r.doneOn !== today, a, o) })),

        addTask: (text) => set((s) => ({ tasks: [{ id: uid(), text, done: false }, ...s.tasks] })),
        updateTask: (id, text) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, text } : t)) })),
        deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
        toggleTask: (id) =>
          set((s) => {
            const t = s.tasks.find((x) => x.id === id)
            return t ? { tasks: moveToEnd(s.tasks, id, { done: !t.done }) } : {}
          }),
        reorderTasks: (a, o, done) => set((s) => ({ tasks: reorderWithin(s.tasks, (t) => t.done === done, a, o) })),
        clearDoneTasks: () => set((s) => ({ tasks: s.tasks.filter((t) => !t.done) })),

        addProject: (title, status) => {
          const id = uid()
          const p: Project = {
            id,
            title,
            description: '',
            status,
            sphereId: get().sphereFilter,
            tasks: [],
            createdAt: Date.now(),
            doneAt: status === 'done' ? Date.now() : null,
          }
          set((s) => ({ projects: [p, ...s.projects] }))
          return id
        },
        updateProject: (id, patch) =>
          mapProject(id, (p) => {
            const next = { ...p, ...patch }
            if (patch.status && patch.status !== p.status) next.doneAt = patch.status === 'done' ? Date.now() : null
            return next
          }),
        deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
        setProjects: (projects) => set({ projects }),
        addProjectTask: (pid, text) =>
          mapProject(pid, (p) => ({ ...p, tasks: [{ id: uid(), text, done: false }, ...p.tasks] })),
        updateProjectTask: (pid, id, text) =>
          mapProject(pid, (p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, text } : t)) })),
        deleteProjectTask: (pid, id) => mapProject(pid, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) })),
        toggleProjectTask: (pid, id) =>
          mapProject(pid, (p) => {
            const t = p.tasks.find((x) => x.id === id)
            return t ? { ...p, tasks: moveToEnd(p.tasks, id, { done: !t.done }) } : p
          }),
        reorderProjectTasks: (pid, a, o, done) =>
          mapProject(pid, (p) => ({ ...p, tasks: reorderWithin(p.tasks, (t) => t.done === done, a, o) })),

        addSphere: (name, color) => set((s) => ({ spheres: [...s.spheres, { id: uid(), name, color }] })),
        updateSphere: (id, patch) =>
          set((s) => ({ spheres: s.spheres.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
        deleteSphere: (id) =>
          set((s) => ({
            spheres: s.spheres.filter((x) => x.id !== id),
            projects: s.projects.map((p) => (p.sphereId === id ? { ...p, sphereId: null } : p)),
            sphereFilter: s.sphereFilter === id ? null : s.sphereFilter,
          })),

        setDayStartHour: (h) => set({ dayStartHour: h }),
        toggleCollapsed: (key) => set((s) => ({ collapsed: { ...s.collapsed, [key]: !s.collapsed[key] } })),
        setSphereFilter: (id) => set({ sphereFilter: id }),
        importData: (data) => set({ ...initialData, ...data }),
      }
    },
    { name: 'life-organizer', version: 1 },
  ),
)

export const pickData = (s: State): Data => ({
  notes: s.notes,
  routines: s.routines,
  tasks: s.tasks,
  projects: s.projects,
  spheres: s.spheres,
  dayStartHour: s.dayStartHour,
})
