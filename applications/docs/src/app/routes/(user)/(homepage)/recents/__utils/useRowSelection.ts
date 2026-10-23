import { useEffect, useState } from 'react'

export type RowSelection = {
  selectedIds: string[]
  isSelected: (id: string) => boolean
  select: (id: string) => void
  toggle: (id: string) => void
  toggleRange: (id: string) => void
  toggleAll: () => void
  set: (ids: string[]) => void
  clear: () => void
  allState: 'none' | 'some' | 'all'
}

// Mirrors Drive's `useSelectionControls`: the anchor is the start of a shift-click range.
export function useRowSelection(selectableIds: string[], resetKey: string): RowSelection {
  const [selected, setSelected] = useState<string[]>([])
  const [anchorId, setAnchorId] = useState<string>()

  const clear = () => {
    setSelected([])
    setAnchorId(undefined)
  }
  useEffect(() => {
    setSelected([])
    setAnchorId(undefined)
  }, [resetKey])

  const selectedIds = intersect(selected, selectableIds)
  const allState = getAllState(selectedIds, selectableIds)

  const select = (id: string) => {
    setSelected([id])
    setAnchorId(id)
  }

  return {
    selectedIds,
    isSelected: (id) => selectedIds.includes(id),
    select,
    toggle: (id) => {
      const isSelected = selectedIds.includes(id)
      setAnchorId(isSelected && selectedIds.length === 1 ? undefined : id)
      setSelected(isSelected ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
    },
    toggleRange: (id) => {
      const start = anchorId ? selectableIds.indexOf(anchorId) : -1
      const end = selectableIds.indexOf(id)
      if (start === -1) {
        select(id)
        return
      }
      setSelected(selectableIds.slice(Math.min(start, end), Math.max(start, end) + 1))
    },
    toggleAll: () => {
      setSelected(allState === 'none' ? selectableIds : [])
      setAnchorId(undefined)
    },
    set: setSelected,
    clear,
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
