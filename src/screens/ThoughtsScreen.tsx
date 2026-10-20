import { useState } from 'react'
import { useStore } from '../store'
import { ListScreen } from '../components/ListScreen'
import { AddForm } from '../components/AddItem'
import { NoteList } from '../components/Lists'

/** Thoughts with their archive. Notes live on the today screen. */
export function ThoughtsScreen() {
  const s = useStore()
  const [showArchive, setShowArchive] = useState(false)
  const all = s.notes.filter((n) => n.kind === 'thought')
  const open = all.filter((n) => !n.archived).length
  const archived = all.length - open
  return (
    <ListScreen
      title="Мысли"
      count={open}
      addLabel="+ Мысль"
      add={(close) => (
        <AddForm label="Новая мысль" withSphere onAdd={(t, sp) => s.addNote(t, sp, 'thought')} onClose={close} />
      )}
    >
      <NoteList kind="thought" />
      {archived > 0 && (
        <button className="link-btn" onClick={() => setShowArchive(!showArchive)}>
          {showArchive ? 'Скрыть архив' : `Архив · ${archived}`}
        </button>
      )}
      {showArchive && <NoteList kind="thought" show="done" />}
    </ListScreen>
  )
}
