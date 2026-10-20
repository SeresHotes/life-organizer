import { useEffect, useState, type ReactNode } from 'react'
import { ON_MAIN_SCREEN, dayKey, intervalLabel, routineReopenAt, shortLeft, sortByOrder, taskOrder, useStore, type PlanItem, type Project, type Routine, type State } from '../store'
import { useNow, useRoutineDone } from '../hooks'
import { SortableList } from '../components/SortableList'
import { AddForm, AddItem } from '../components/AddItem'
import { ItemRow } from '../components/ItemRow'
import { NoteList, ProjectBadge } from '../components/Lists'

/** Notes on top, then today's plan: only the tasks and routines picked for today. Past days can be browsed but aren't carried over. */
export function MainScreen() {
  const s = useStore()
  const now = useNow()
  const today = dayKey(s.dayStartHour, new Date(now))
  const [viewed, setViewed] = useState<string | null>(null)
  const [adding, setAdding] = useState<'task' | 'thought' | null>(null)
  const [picking, setPicking] = useState(false)
  const [flash, setFlash] = useState('')
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(''), 2500)
    return () => clearTimeout(t)
  }, [flash])

  if (picking) return <DayPicker today={today} onDone={() => setPicking(false)} />

  const day = viewed && viewed < today ? viewed : today
  const isToday = day === today
  // only days with something planned, so weeks of not opening the app don't have to be paged through
  const filled = Object.keys(s.days)
    .filter((k) => k < today && s.days[k].length > 0)
    .sort()
  const prev = filled.filter((k) => k < day).at(-1)
  const next = isToday ? undefined : (filled.find((k) => k > day) ?? today)
  const items = s.days[day] ?? []
  const open = items.filter((x) => !x.done)
  const done = items.filter((x) => x.done)
  const todayIds = new Set((s.days[today] ?? []).map((x) => x.id))

  return (
    <div className="today-screen">
      <TodayNotes />

      <div className="day-nav">
        <button className="icon-btn" disabled={!prev} onClick={() => setViewed(prev!)} aria-label="Предыдущий день">
          ‹
        </button>
        <div className="day-title">
          <div>{isToday ? 'Сегодня' : daysAgo(today, day)}</div>
          <div className="hint">{dateLabel(day)}</div>
        </div>
        <button
          className="icon-btn"
          disabled={!next}
          onClick={() => setViewed(next === today ? null : next!)}
          aria-label="Следующий день"
        >
          ›
        </button>
      </div>

      <div className="today-list">
        {adding === 'task' && (
          <AddForm
            label="Задача на сегодня"
            withSphere
            withInterval="optional"
            onAdd={(text, sp, interval) => {
              const id = interval ? s.addRoutine(null, text, sp, interval) : s.addTask(null, text, sp)
              s.planAdd({ id, type: interval ? 'routine' : 'task', owner: null, text })
            }}
            onClose={() => setAdding(null)}
          />
        )}
        {adding === 'thought' && (
          <AddForm
            label="Мысль"
            withSphere
            onAdd={(text, sp) => {
              s.addNote(text, sp, 'thought')
              setFlash('Мысль сохранена')
            }}
            onClose={() => setAdding(null)}
          />
        )}
        {flash && <div className="flash">{flash}</div>}

        {isToday ? (
          <>
            <SortableList items={open} onReorder={s.planReorder} render={(x) => <PlanRow item={x} />} />
            {done.length > 0 && <div className="divider">Выполнено · {done.length}</div>}
            <SortableList items={done} render={(x) => <PlanRow item={x} />} />
            {items.length === 0 && !adding && (
              <p className="empty">На сегодня ничего не выбрано. Выберите задачи из списка или добавьте новую.</p>
            )}
          </>
        ) : (
          <>
            {[...open, ...done].map((x) => (
              <PastRow key={x.id} item={x} planned={todayIds.has(x.id)} />
            ))}
          </>
        )}
      </div>

      <div className="today-actions">
        {isToday ? (
          <>
            <button className="primary" onClick={() => setAdding('task')}>
              + На сегодня
            </button>
            <button onClick={() => setAdding('thought')}>+ Мысль</button>
            <button onClick={() => setPicking(true)}>☰ Выбрать</button>
          </>
        ) : (
          <button onClick={() => setViewed(null)}>К сегодня</button>
        )}
      </div>
    </div>
  )
}

/** Notes: always at hand, independent of the day. */
function TodayNotes() {
  const s = useStore()
  const [adding, setAdding] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const archived = s.notes.filter((n) => n.kind === 'note' && n.archived).length
  return (
    <div className="today-notes">
      <div className="today-notes-head">
        <span className="section-title">Заметки</span>
        <button className="add-icon small" aria-label="Добавить заметку" onClick={() => setAdding(true)}>
          +
        </button>
      </div>
      <div className="today-notes-body">
        {adding && (
          <AddForm label="Новая заметка" withSphere onAdd={(t, sp) => s.addNote(t, sp, 'note')} onClose={() => setAdding(false)} />
        )}
        <NoteList kind="note" />
        {archived > 0 && (
          <button className="link-btn small" onClick={() => setShowArchive(!showArchive)}>
            {showArchive ? 'Скрыть архив' : `Архив · ${archived}`}
          </button>
        )}
        {showArchive && <NoteList kind="note" show="done" />}
      </div>
    </div>
  )
}

const dateLabel = (key: string) =>
  new Date(key + 'T12:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

function daysAgo(today: string, day: string) {
  const n = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000)
  if (n === 1) return 'Вчера'
  const m10 = n % 10
  const m100 = n % 100
  const word = m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней'
  return `${n} ${word} назад`
}

/** The task/routine a plan item refers to (undefined if it was deleted since). */
function useSource(item: PlanItem) {
  return useStore((s: State) => {
    const owner = item.owner === null ? s : s.projects.find((p) => p.id === item.owner)
    const list = item.type === 'task' ? owner?.tasks : owner?.routines
    return (list as { id: string; text: string; sphereId: string | null; done?: boolean }[] | undefined)?.find((x) => x.id === item.id)
  })
}

function useProject(item: PlanItem) {
  return useStore((s) => (item.owner === null ? undefined : s.projects.find((p) => p.id === item.owner)))
}

/** A row of today's plan: checking it closes the task / routine itself. */
function PlanRow({ item }: { item: PlanItem }) {
  const s = useStore()
  const source = useSource(item)
  const project = useProject(item)
  return (
    <ItemRow
      text={item.text}
      done={item.done}
      badge={project && <ProjectBadge project={project} />}
      meta={item.type === 'routine' ? '↻' : null}
      sphereId={item.owner === null ? (source?.sphereId ?? null) : null}
      onToggle={() => s.planToggleDone(item.id)}
      onSave={(text) => {
        if (!source) return
        if (item.type === 'task') s.updateTask(item.owner, item.id, { text })
        else s.updateRoutine(item.owner, item.id, { text })
      }}
      editExtra={
        <button className="link-btn left" onPointerDown={(e) => e.preventDefault()} onClick={() => s.planRemove(item.id)}>
          Убрать из сегодня
        </button>
      }
    />
  )
}

/** A row of a past day: read-only; an unfinished item can be picked for today again. */
function PastRow({ item, planned }: { item: PlanItem; planned: boolean }) {
  const s = useStore()
  const { isDone } = useRoutineDone()
  const source = useSource(item)
  const project = useProject(item)
  const canRepeat = !item.done && !planned && source && !source.done
  return (
    <div className={'item' + (item.done ? ' done' : '')}>
      <span className={'check static' + (item.done ? ' checked' : '')}>{item.done ? '✓' : ''}</span>
      <div className="item-body static">
        {project && <ProjectBadge project={project} />}
        <span className="item-text">{item.text}</span>
      </div>
      {canRepeat && (
        <button
          className="link-btn small"
          onClick={() =>
            s.planAdd(
              { id: item.id, type: item.type, owner: item.owner, text: source.text },
              item.type === 'routine' && isDone(source as Routine),
            )
          }
        >
          На сегодня
        </button>
      )}
      {planned && <span className="item-meta">в сегодня</span>}
    </div>
  )
}

/** Picking tasks and routines for today: own ones and those of active projects. */
function DayPicker({ today, onDone }: { today: string; onDone: () => void }) {
  const s = useStore()
  const { now, dayStartHour, isDone } = useRoutineDone()
  const planned = new Set((s.days[today] ?? []).map((x) => x.id))
  const toggle = (item: Omit<PlanItem, 'done'>, done = false) =>
    planned.has(item.id) ? s.planRemove(item.id) : s.planAdd(item, done)

  const active = s.projects.filter((p) => ON_MAIN_SCREEN.includes(p.status))
  // own tasks and all routines form one list, as on the tasks screen
  type E = { id: string; owner: string | null; project?: Project } & (
    | { kind: 'task'; text: string }
    | { kind: 'routine'; routine: Routine }
  )
  const entries = sortByOrder(
    [
      ...s.tasks.filter((t) => !t.done).map((t): E => ({ id: t.id, kind: 'task', owner: null, text: t.text })),
      ...s.routines.map((r): E => ({ id: r.id, kind: 'routine', owner: null, routine: r })),
      ...active.flatMap((p) => p.routines.map((r): E => ({ id: r.id, kind: 'routine', owner: p.id, routine: r, project: p }))),
    ],
    taskOrder(s.mainOrder),
  )
  // routines that are already done wait at the bottom
  const resting = (e: E) => e.kind === 'routine' && isDone(e.routine)
  entries.sort((a, b) => Number(resting(a)) - Number(resting(b)))

  return (
    <div className="page picker">
      <div className="page-head">
        <h2 className="grow">Выбрать на сегодня</h2>
        <button className="primary" onClick={onDone}>
          Готово
        </button>
      </div>

      <h3>Задачи</h3>
      <AddItem
        label="Новая задача"
        withSphere
        withInterval="optional"
        onAdd={(text, sp, interval) => {
          const id = interval ? s.addRoutine(null, text, sp, interval) : s.addTask(null, text, sp)
          s.planAdd({ id, type: interval ? 'routine' : 'task', owner: null, text })
        }}
      />
      {entries.map((e) => {
        if (e.kind === 'task')
          return (
            <PickRow
              key={e.id}
              text={e.text}
              selected={planned.has(e.id)}
              onClick={() => toggle({ id: e.id, type: 'task', owner: null, text: e.text })}
            />
          )
        const r = e.routine
        const reopenAt = routineReopenAt(r, dayStartHour)
        const done = reopenAt !== null && now < reopenAt
        return (
          <PickRow
            key={r.id}
            text={r.text}
            selected={planned.has(r.id)}
            done={done}
            badge={e.project && <span className="badge">{e.project.title}</span>}
            meta={done ? shortLeft(reopenAt - now) : r.interval !== 24 ? '↻' + intervalLabel(r.interval) : null}
            onClick={() => toggle({ id: r.id, type: 'routine', owner: e.owner, text: r.text }, done)}
          />
        )
      })}

      {active.map((p) => {
        const tasks = p.tasks.filter((t) => !t.done)
        if (tasks.length === 0) return null
        return (
          <div key={p.id}>
            <div className="divider">{p.title}</div>
            {tasks.map((t) => (
              <PickRow
                key={t.id}
                text={t.text}
                selected={planned.has(t.id)}
                onClick={() => toggle({ id: t.id, type: 'task', owner: p.id, text: t.text })}
              />
            ))}
          </div>
        )
      })}

    </div>
  )
}

function PickRow(props: { text: string; selected: boolean; done?: boolean; badge?: ReactNode; meta?: ReactNode; onClick: () => void }) {
  const { text, selected, done, badge, meta, onClick } = props
  return (
    <button className={'pick-row' + (done ? ' done' : '')} onClick={onClick}>
      <span className={'check' + (selected ? ' picked' : '')}>{selected ? '✓' : ''}</span>
      <span className="item-body">
        {badge}
        <span className="item-text">{text}</span>
      </span>
      {meta && <span className="item-meta">{meta}</span>}
    </button>
  )
}
