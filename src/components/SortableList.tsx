import type { ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from './modifiers'
import { CSS } from '@dnd-kit/utilities'

type Props<T extends { id: string }> = {
  items: T[]
  onReorder?: (activeId: string, overId: string) => void
  render: (item: T, handle: ReactNode) => ReactNode
}

/** Vertical list whose items can be reordered by a drag handle. */
export function SortableList<T extends { id: string }>({ items, onReorder, render }: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onReorder?.(String(active.id), String(over.id))
  }
  if (!onReorder) return <>{items.map((it) => <div key={it.id}>{render(it, null)}</div>)}</>
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((it) => (
          <SortableItem key={it.id} id={it.id}>
            {(handle) => render(it, handle)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const handle = (
    <button className="handle" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Перетащить">
      ⋮⋮
    </button>
  )
  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'dragging' : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children(handle)}
    </div>
  )
}
