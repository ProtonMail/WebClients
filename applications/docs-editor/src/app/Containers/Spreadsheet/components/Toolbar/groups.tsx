import {
  type ComponentPropsWithoutRef,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useEvent } from '../utils'
import debounce from '@proton/utils/debounce'

const RESIZE_DEBOUNCE_WAIT = 50

export type GroupsValue = {
  overflowingGroupIds: Set<string>
  lastGroupId?: string
}

const groupsContext = createContext<GroupsValue | undefined>(undefined)

export type GroupsProviderProps = {
  children: ReactNode
  toolbarContainerElement: HTMLElement | null
}

export function GroupsProvider({ children, toolbarContainerElement }: GroupsProviderProps) {
  const [overflowingGroupIds, setOverflowingGroupIds] = useState<Set<string>>(new Set())
  const [lastGroupId, setLastGroupId] = useState<string>()
  const compute = useEvent(async () => {
    if (toolbarContainerElement) {
      const { overflowingGroupIds, lastGroupId } = await computeOverflowingGroups(toolbarContainerElement)
      setOverflowingGroupIds(overflowingGroupIds)
      setLastGroupId(lastGroupId)
    }
  })

  // Compute on mount.
  useEffect(() => {
    if (toolbarContainerElement) {
      void compute()
    }
  }, [compute, toolbarContainerElement])

  // Compute on resize.
  const [debouncedCompute] = useState(() => debounce(compute, RESIZE_DEBOUNCE_WAIT))
  useEffect(() => {
    if (toolbarContainerElement) {
      const observer = new ResizeObserver(debouncedCompute)
      observer.observe(toolbarContainerElement)
      return () => observer.disconnect()
    }
  }, [debouncedCompute, toolbarContainerElement])

  const value = useMemo(() => ({ overflowingGroupIds, lastGroupId }), [overflowingGroupIds, lastGroupId])
  return <groupsContext.Provider value={value}>{children}</groupsContext.Provider>
}

export type UseGroupReturn = {
  props: ComponentPropsWithoutRef<'div'>
  hidden: boolean
  separatorProps: ComponentPropsWithoutRef<'hr'>
}

export function useGroup(groupId: string): UseGroupReturn {
  const type = useGroupType()
  const value = useContext(groupsContext)
  if (!value) {
    throw new Error('useGroup must be used within a GroupsProvider')
  }
  const isOverflowing = value.overflowingGroupIds.has(groupId)
  const hidden = type === 'main' ? isOverflowing : !isOverflowing
  const props = {
    'data-group-id': groupId,
    'data-hidden': hidden ? '' : undefined,
    className:
      type === 'main'
        ? '[body:not([data-recalculating-toolbar-groups])_&]:data-[hidden]:hidden'
        : 'data-[hidden]:hidden',
  }
  const hideTrailingSeparator = value.lastGroupId === groupId
  const separatorProps = {
    'data-hidden': hideTrailingSeparator ? '' : undefined,
    className: '[body:not([data-recalculating-toolbar-groups])_&]:data-[hidden]:hidden',
  }
  return { hidden, props, separatorProps }
}

export function useHasOverflow() {
  const value = useContext(groupsContext)
  if (!value) {
    throw new Error('useGroup must be used within a GroupsProvider')
  }
  return value.overflowingGroupIds.size > 0
}

async function computeOverflowingGroups(container: HTMLElement) {
  document.body.setAttribute('data-recalculating-toolbar-groups', '')

  const elements = Array.from(container.querySelectorAll<HTMLElement>('[data-group-id]'))
  const lastGroupId = elements.at(-1)?.getAttribute('data-group-id')
  if (!lastGroupId) {
    throw new Error('Missing data-group-id attribute on last group')
  }
  const overflowingGroupIds = new Set<string>()
  let isFirst = true
  let wasOverflow = false

  for (const group of elements) {
    if (isFirst) {
      isFirst = false
      continue
    }

    const groupId = group.getAttribute('data-group-id')
    if (!groupId) {
      throw new Error('Missing data-group-id attribute')
    }
    let isOverflowing = false
    if (wasOverflow) {
      isOverflowing = true
    } else {
      const rect = group.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      isOverflowing = rect.right > containerRect.right
    }

    if (isOverflowing) {
      wasOverflow = true
      overflowingGroupIds.add(groupId)
    }
  }

  document.body.removeAttribute('data-recalculating-toolbar-groups')

  return { overflowingGroupIds, lastGroupId }
}

type GroupType = 'main' | 'overflow'

const groupTypeContext = createContext<GroupType | undefined>(undefined)

export type GroupTypeProviderProps = { children: ReactNode; type: GroupType }

export function GroupTypeProvider({ children, type }: GroupTypeProviderProps) {
  return <groupTypeContext.Provider value={type}>{children}</groupTypeContext.Provider>
}

function useGroupType() {
  const value = useContext(groupTypeContext)
  if (!value) {
    throw new Error('useGroupType must be used within a GroupTypeProvider')
  }
  return value
}
