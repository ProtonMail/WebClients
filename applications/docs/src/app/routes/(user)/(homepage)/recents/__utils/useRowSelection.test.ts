import { act, renderHook } from '@testing-library/react'
import { useRowSelection } from './useRowSelection'

function setup() {
  return renderHook(({ ids, key }) => useRowSelection(ids, key), {
    initialProps: { ids: ['a', 'b'], key: 'k' },
  })
}

describe('useRowSelection', () => {
  it('toggleAll selects all, then clears when all are selected', () => {
    const { result } = setup()
    expect(result.current.allState).toBe('none')

    act(() => result.current.toggleAll())
    expect(result.current.allState).toBe('all')
    expect(result.current.selectedIds).toEqual(['a', 'b'])

    act(() => result.current.toggleAll())
    expect(result.current.allState).toBe('none')
  })

  it('toggleAll clears when some are selected', () => {
    const { result } = setup()
    act(() => result.current.toggle('a'))

    act(() => result.current.toggleAll())
    expect(result.current.allState).toBe('none')
  })

  it('allState is some when part of the ids are selected', () => {
    const { result } = setup()

    act(() => result.current.toggle('a'))
    expect(result.current.allState).toBe('some')

    act(() => result.current.toggle('a'))
    expect(result.current.allState).toBe('none')
  })

  it('drops selected ids that are no longer selectable', () => {
    const { result, rerender } = setup()
    act(() => result.current.toggleAll())

    rerender({ ids: ['b'], key: 'k' })

    expect(result.current.selectedIds).toEqual(['b'])
    expect(result.current.allState).toBe('all')
  })

  it('clears the selection when resetKey changes', () => {
    const { result, rerender } = setup()
    act(() => result.current.toggle('a'))

    rerender({ ids: ['a', 'b'], key: 'other' })

    expect(result.current.selectedIds).toEqual([])
  })
})
