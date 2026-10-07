import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Task = { id: string; text: string; done: boolean; sphereId: string | null }
export type Note = { id: string; text: string; archived: boolean; sphereId: string | null }
export type Routine = { id: string; text: string; doneOn: string | null; doneAt: number; sphereId: string | null }
export type Status = 'open' | 'backlog' | 'progress' | 'waiting' | 'done'
export type Sphere = { id: string; name: string; color: string }
export type Project = {
  id: string
  title: string
  description: string
  status: Status
  sphereId: string | null
  tasks: Task[]
  routines: Routine[]
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

/** Projects whose first open task and routines are shown on the main screen. */
export const ON_MAIN_SCREEN: Status[] = ['backlog', 'progress']

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
  /**
   * Order of the mixed main-screen lists (own items + items coming from projects).
   * tasks: own task ids and `project:<id>` slots (a project's slot shows its first open task);
   * routines: routine ids (own and projects').
   */
  mainOrder: { tasks: string[]; routines: string[] }
}

type UI = {
  collapsed: Record<string, boolean>
  sphereFilter: string | null
}

/** Owner of a task/routine list: a project id, or null for the main screen. */
export type Owner = string | null

type Actions = {
  // notes
  addNote: (text: string, sphereId?: string | null) => void
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void
  deleteNote: (id: string) => void
  toggleNoteArchived: (id: string) => void
  reorderNotes: (activeId: string, overId: string, archived: boolean) => void
  // routines (main screen or project)
  addRoutine: (owner: Owner, text: string, sphereId?: string | null) => void
  updateRoutine: (owner: Owner, id: string, patch: Partial<Omit<Routine, 'id'>>) => void
  deleteRoutine: (owner: Owner, id: string) => void
  toggleRoutine: (owner: Owner, id: string, today: string) => void
  reorderRoutines: (owner: Owner, activeId: string, overId: string, today: string) => void
  // tasks (main screen or project)
  addTask: (owner: Owner, text: string, sphereId?: string | null) => void
  updateTask: (owner: Owner, id: string, patch: Partial<Omit<Task, 'id'>>) => void
  deleteTask: (owner: Owner, id: string) => void
  toggleTask: (owner: Owner, id: string) => void
  reorderTasks: (owner: Owner, activeId: string, overId: string, done: boolean) => void
  clearDoneTasks: () => void
  // projects
  addProject: (title: string, status: Status, sphereId?: string | null) => string
  updateProject: (id: string, patch: Partial<Omit<Project, 'id' | 'tasks' | 'routines'>>) => void
  deleteProject: (id: string) => void
  setProjects: (projects: Project[]) => void
  // spheres
  addSphere: (name: string, color: string) => string
  updateSphere: (id: string, patch: Partial<Omit<Sphere, 'id'>>) => void
  deleteSphere: (id: string) => void
  // misc
  setMainOrder: (list: 'tasks' | 'routines', keys: string[]) => void
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
  mainOrder: { tasks: [], routines: [] },
}

/** Stable sort by position in `order`; items not in it (new ones) go first. */
export function sortByOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  const pos = new Map(order.map((k, i) => [k, i]))
  return [...items].sort((a, b) => (pos.get(a.id) ?? -1) - (pos.get(b.id) ?? -1))
}

/** Moves `activeId` to the place of `overId`. */
export function moveKey(keys: string[], activeId: string, overId: string) {
  const from = keys.indexOf(activeId)
  const to = keys.indexOf(overId)
  if (from < 0 || to < 0) return keys
  const next = [...keys]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

/** Fills fields added in later versions, so old exports/storage keep working. */
function normalize(data: Partial<Data>): Data {
  const sph = <T extends object>(x: T) => ({ sphereId: null, ...x })
  return {
    ...initialData,
    ...data,
    mainOrder: { ...initialData.mainOrder, ...data.mainOrder },
    notes: (data.notes ?? []).map((n) => ({ ...sph(n), archived: n.archived ?? false })),
    routines: (data.routines ?? []).map(sph),
    tasks: (data.tasks ?? []).map(sph),
    projects: (data.projects ?? []).map((p) => ({
      ...p,
      tasks: (p.tasks ?? []).map(sph),
      routines: (p.routines ?? []).map(sph),
    })),
  }
}

export const useStore = create<State>()(
  persist(
    (set) => {
      const mapProject = (pid: string, fn: (p: Project) => Project) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === pid ? fn(p) : p)) }))

      /** Applies `fn` to the tasks/routines list of the main screen or of a project. */
      function editList<K extends 'tasks' | 'routines'>(key: K, owner: Owner, fn: (list: Data[K]) => Data[K]) {
        if (owner === null) set((s) => ({ [key]: fn(s[key]) }) as Partial<State>)
        else mapProject(owner, (p) => ({ ...p, [key]: fn(p[key] as Data[K]) }))
      }

      return {
        ...initialData,
        collapsed: {},
        sphereFilter: null,

        addNote: (text, sphereId = null) =>
          set((s) => ({ notes: [{ id: uid(), text, archived: false, sphereId }, ...s.notes] })),
        updateNote: (id, patch) => set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
        deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
        toggleNoteArchived: (id) =>
          set((s) => {
            const n = s.notes.find((x) => x.id === id)
            return n ? { notes: moveToEnd(s.notes, id, { archived: !n.archived }) } : {}
          }),
        reorderNotes: (a, o, archived) =>
          set((s) => ({ notes: reorderWithin(s.notes, (n) => n.archived === archived, a, o) })),

        addRoutine: (owner, text, sphereId = null) =>
          editList('routines', owner, (l) => [{ id: uid(), text, doneOn: null, doneAt: 0, sphereId }, ...l]),
        updateRoutine: (owner, id, patch) =>
          editList('routines', owner, (l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r))),
        deleteRoutine: (owner, id) => editList('routines', owner, (l) => l.filter((r) => r.id !== id)),
        toggleRoutine: (owner, id, today) =>
          editList('routines', owner, (l) =>
            l.map((r) =>
              r.id !== id ? r : r.doneOn === today ? { ...r, doneOn: null } : { ...r, doneOn: today, doneAt: Date.now() },
            ),
          ),
        reorderRoutines: (owner, a, o, today) =>
          editList('routines', owner, (l) => reorderWithin(l, (r) => r.doneOn !== today, a, o)),

        addTask: (owner, text, sphereId = null) =>
          editList('tasks', owner, (l) => [{ id: uid(), text, done: false, sphereId }, ...l]),
        updateTask: (owner, id, patch) =>
          editList('tasks', owner, (l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t))),
        deleteTask: (owner, id) => editList('tasks', owner, (l) => l.filter((t) => t.id !== id)),
        toggleTask: (owner, id) =>
          editList('tasks', owner, (l) => {
            const t = l.find((x) => x.id === id)
            return t ? moveToEnd(l, id, { done: !t.done }) : l
          }),
        reorderTasks: (owner, a, o, done) =>
          editList('tasks', owner, (l) => reorderWithin(l, (t) => t.done === done, a, o)),
        clearDoneTasks: () => set((s) => ({ tasks: s.tasks.filter((t) => !t.done) })),

        addProject: (title, status, sphereId = null) => {
          const id = uid()
          const p: Project = {
            id,
            title,
            description: '',
            status,
            sphereId,
            tasks: [],
            routines: [],
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

        addSphere: (name, color) => {
          const id = uid()
          set((s) => ({ spheres: [...s.spheres, { id, name, color }] }))
          return id
        },
        updateSphere: (id, patch) =>
          set((s) => ({ spheres: s.spheres.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
        deleteSphere: (id) =>
          set((s) => {
            const un = <T extends { sphereId: string | null }>(x: T): T => (x.sphereId === id ? { ...x, sphereId: null } : x)
            return {
              spheres: s.spheres.filter((x) => x.id !== id),
              notes: s.notes.map(un),
              routines: s.routines.map(un),
              tasks: s.tasks.map(un),
              projects: s.projects.map(un),
              sphereFilter: s.sphereFilter === id ? null : s.sphereFilter,
            }
          }),

        setMainOrder: (list, keys) =>
          set((s) => {
            // keep the own list in the same order, so other screens agree with the main one
            const pos = new Map(keys.map((k, i) => [k, i]))
            const byPos = <T extends { id: string }>(a: T, b: T) => (pos.get(a.id) ?? -1) - (pos.get(b.id) ?? -1)
            const mainOrder = { ...s.mainOrder, [list]: keys }
            if (list === 'tasks') {
              const open = s.tasks.filter((t) => !t.done).sort(byPos)
              return { mainOrder, tasks: [...open, ...s.tasks.filter((t) => t.done)] }
            }
            return { mainOrder, routines: [...s.routines].sort(byPos) }
          }),
        setDayStartHour: (h) => set({ dayStartHour: h }),
        toggleCollapsed: (key) => set((s) => ({ collapsed: { ...s.collapsed, [key]: !s.collapsed[key] } })),
        setSphereFilter: (id) => set({ sphereFilter: id }),
        importData: (data) => set(normalize(data)),
      }
    },
    {
      name: 'life-organizer',
      version: 2,
      migrate: (persisted) => {
        const s = persisted as Partial<State>
        return { ...s, ...normalize(s) } as State
      },
    },
  ),
)

export const pickData = (s: State): Data => ({
  notes: s.notes,
  routines: s.routines,
  tasks: s.tasks,
  projects: s.projects,
  spheres: s.spheres,
  dayStartHour: s.dayStartHour,
  mainOrder: s.mainOrder,
})
