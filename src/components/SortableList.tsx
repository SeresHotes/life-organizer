import type { ReactNode } from 'react'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from './modifiers'

/** Don't start dragging from form controls (text being edited, checkboxes, selects). */
const fromControl = (e: Event) => !!(e.target as Element | null)?.closest?.('textarea, input, select, button')

class ItemMouseSensor extends MouseSensor {
  static activators = [
    { eventName: 'onMouseDown' as const, handler: ({ nativeEvent: e }: React.MouseEvent) => e.button === 0 && !fromControl(e) },
  ]
}

class ItemTouchSensor extends TouchSensor {
  static activators = [{ eventName: 'onTouchStart' as const, handler: ({ nativeEvent: e }: React.TouchEvent) => !fromControl(e) }]
}

/** Mouse: drag after moving 5px. Touch: long press (so normal swipes still scroll the list). */
export function useItemSensors() {
  return useSensors(
    useSensor(ItemMouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(ItemTouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  )
}

export const vibrate = () => navigator.vibrate?.(15)

type Props<T extends { id: string }> = {
  items: T[]
  onReorder?: (activeId: string, overId: string) => void
  render: (item: T) => ReactNode
}

/** Vertical list whose items can be reordered by dragging (long press on touch screens). */
export function SortableList<T extends { id: string }>({ items, onReorder, render }: Props<T>) {
  const sensors = useItemSensors()
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onReorder?.(String(active.id), String(over.id))
  }
  if (!onReorder) return <>{items.map((it) => <div key={it.id}>{render(it)}</div>)}</>
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={vibrate}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((it) => (
          <SortableItem key={it.id} id={it.id}>
            {render(it)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      className={'sortable' + (isDragging ? ' dragging' : '')}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...listeners}
    >
      {children}
    </div>
  )
}
