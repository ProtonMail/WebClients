import { useEffect, useState } from 'react'

export type RowSelection = {
  selectedIds: string[]
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  toggleAll: () => void
  set: (ids: string[]) => void
  clear: () => void
  allState: 'none' | 'some' | 'all'
}

export function useRowSelection(selectableIds: string[], resetKey: string): RowSelection {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => setSelected([]), [resetKey])

  const selectedIds = intersect(selected, selectableIds)
  const allState = getAllState(selectedIds, selectableIds)

  return {
    selectedIds,
    isSelected: (id) => selectedIds.includes(id),
    toggle: (id) => setSelected(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]),
    toggleAll: () => setSelected(allState === 'none' ? selectableIds : []),
    set: setSelected,
    clear: () => setSelected([]),
    allState,
  }
}

function getAllState(selected: string[], selectable: string[]): RowSelection['allState'] {
  if (selected.length === 0) {
    return 'none'
  }
  return selected.length === selectable.length ? 'all' : 'some'
}

function intersect(selected: string[], selectable: string[]) {
  const allowed = new Set(selectable)
  return selected.filter((id) => allowed.has(id))
}
