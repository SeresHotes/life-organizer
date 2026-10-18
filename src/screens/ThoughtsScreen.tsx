import { useState } from 'react'
import { useStore, type NoteKind } from '../store'
import { Section } from '../components/Section'
import { AddForm } from '../components/AddItem'
import { NoteList } from '../components/Lists'

/** Thoughts and notes, each with its own archive. */
export function ThoughtsScreen() {
  return (
    <div className="main-screen">
      <Notes kind="thought" />
      <Notes kind="note" />
    </div>
  )
}

function Notes({ kind }: { kind: NoteKind }) {
  const s = useStore()
  const [showArchive, setShowArchive] = useState(false)
  const all = s.notes.filter((n) => n.kind === kind)
  const open = all.filter((n) => !n.archived).length
  const archived = all.length - open
  const thought = kind === 'thought'
  return (
    <Section
      group="thoughts"
      id={thought ? 'thoughts' : 'notes'}
      defaultExpanded={thought}
      title={thought ? 'Мысли' : 'Заметки'}
      count={open}
      add={(close) => (
        <AddForm
          label={thought ? 'Новая мысль' : 'Новая заметка'}
          withSphere
          onAdd={(t, sp) => s.addNote(t, sp, kind)}
          onClose={close}
        />
      )}
    >
      <NoteList kind={kind} />
      {archived > 0 && (
        <button className="link-btn" onClick={() => setShowArchive(!showArchive)}>
          {showArchive ? 'Скрыть архив' : `Архив · ${archived}`}
        </button>
      )}
      {showArchive && <NoteList kind={kind} show="done" />}
    </Section>
  )
}
