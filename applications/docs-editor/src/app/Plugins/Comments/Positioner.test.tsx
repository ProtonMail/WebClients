import { act, render, screen } from '@testing-library/react'
import { Positioner } from './Positioner'

// Add this mock setup at the top of the file, before the tests
beforeEach(() => {
  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  }))
})

afterEach(() => {
  // Clean up the mock after each test
  // @ts-ignore
  global.ResizeObserver = undefined
})

describe('Positioner', () => {
  const createMockItems = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      item: <div data-testid={`item-${i}`}>Item {i}</div>,
      position: i * 50,
    }))
  }

  // Helper function for waiting for position updates
  const waitForPositionUpdates = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }

  it('renders items in correct initial positions', async () => {
    const items = createMockItems(3)
    const { container } = render(
      <Positioner items={items} activeItemID={undefined} positionUpdateDebounceTimeout={0} />,
    )

    await waitForPositionUpdates()

    const itemElements = container.querySelectorAll('[data-position]')
    expect(itemElements).toHaveLength(3)

    itemElements.forEach((el, i) => {
      expect(el).toHaveAttribute('data-position', `${i * 50}`)
      expect(el).toHaveStyle({
        '--initial-position': `${i * 50}px`,
        position: 'absolute',
        top: '0',
      })
    })
  })

  it('handles scroll container offset', async () => {
    const items = createMockItems(2)
    const scrollContainer = document.createElement('div')
    scrollContainer.scrollTop = 100

    const mockGetBoundingClientRect = jest.fn().mockReturnValue({ top: 50 })
    scrollContainer.getBoundingClientRect = mockGetBoundingClientRect

    render(
      <Positioner
        items={items}
        activeItemID={undefined}
        scrollContainer={scrollContainer}
        positionUpdateDebounceTimeout={0}
      />,
    )

    await waitForPositionUpdates()

    const item1 = screen.getByTestId('item-0')
    expect(item1.parentElement).toHaveStyle({
      '--initial-position': '50px', // position (0) + offset (50)
    })
  })

  it('cleans up resize observers on unmount', async () => {
    const disconnect = jest.fn()
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect,
    }))

    const items = createMockItems(2)
    const { unmount } = render(<Positioner items={items} activeItemID={undefined} positionUpdateDebounceTimeout={0} />)

    await waitForPositionUpdates()

    unmount()
    expect(disconnect).toHaveBeenCalled()
  })

  it('maintains minimum gap between items when they would collide', async () => {
    const collisionItems = [
      {
        id: '1',
        item: <div>Item 1</div>,
        position: 0,
      },
      {
        id: '2',
        item: <div>Item 2</div>,
        position: 40, // This would collide with item 1
      },
    ]

    const { container } = render(
      <Positioner items={collisionItems} activeItemID={undefined} gap={10} positionUpdateDebounceTimeout={0} />,
    )

    const item1 = container.querySelector('[data-id="1"]')
    Object.defineProperty(item1, 'clientHeight', { value: 60 })

    const item2 = container.querySelector('[data-id="2"]')
    Object.defineProperty(item2, 'clientHeight', { value: 60 })

    await waitForPositionUpdates()

    expect(item2).toHaveStyle({
      '--position': '70px', // First item height (60px) + gap (10px)
    })
  })

  it('adjusts positions when active item is present', async () => {
    const items = [
      {
        id: '1',
        item: <div>Item 1</div>,
        position: 0,
      },
      {
        id: '2',
        item: <div>Item 2</div>,
        position: 20,
      },
      {
        id: '3',
        item: <div>Item 3</div>,
        position: 40,
      },
    ]

    const { container } = render(
      <Positioner items={items} activeItemID="2" gap={10} positionUpdateDebounceTimeout={0} />,
    )

    const item1 = container.querySelector('[data-id="1"]')
    Object.defineProperty(item1, 'clientHeight', { value: 30 })
    const item2 = container.querySelector('[data-id="2"]')
    Object.defineProperty(item2, 'clientHeight', { value: 30 })
    const item3 = container.querySelector('[data-id="3"]')
    Object.defineProperty(item3, 'clientHeight', { value: 30 })

    await waitForPositionUpdates()

    expect(item1).toHaveStyle({ '--position': '-20px' })
    expect(item2).toHaveStyle({ '--position': '20px' })
    expect(item3).toHaveStyle({ '--position': '60px' })
  })

  it('updates positions when items resize', async () => {
    const items = createMockItems(2)
    const { container } = render(
      <Positioner items={items} activeItemID={undefined} gap={10} positionUpdateDebounceTimeout={0} />,
    )

    await waitForPositionUpdates()

    const [[callback]] = (global.ResizeObserver as jest.Mock).mock.calls
    const item1 = container.querySelector('[data-id="item-0"]')
    Object.defineProperty(item1, 'clientHeight', { value: 100 })

    // Trigger resize observer callback
    callback([{ target: item1 }])

    await waitForPositionUpdates()

    const item2 = container.querySelector('[data-id="item-1"]')
    expect(item2).toHaveStyle({
      '--position': '110px', // First item height (100) + gap (10)
    })
  })
})
