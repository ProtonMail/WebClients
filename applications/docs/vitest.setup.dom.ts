import '@proton/vitest-config/setup'
import '@proton/components/testing/vitest/mockFlagSvg'
import '@proton/components/testing/vitest/mockMatchMedia'

window.ResizeObserver = class {
  observe = vi.fn()

  unobserve = vi.fn()

  disconnect = vi.fn()
} as unknown as typeof ResizeObserver

// Silence warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn()

// A <dialog> without `open` is hidden and nothing in it can take focus. Our CSS reset shows it, tests do not load it.
const style = document.createElement('style')
style.textContent = 'dialog { display: block; }'
document.head.append(style)

// happy-dom loads no iframe page, so `contentWindow` stays null. Give connected iframes a stub window, as jsdom does.
const frameWindows = new WeakMap<HTMLIFrameElement, Window>()
Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
  configurable: true,
  get(this: HTMLIFrameElement) {
    if (!this.isConnected) {
      return null
    }
    if (!frameWindows.has(this)) {
      frameWindows.set(this, { postMessage: () => {}, focus: () => {} } as unknown as Window)
    }
    return frameWindows.get(this)!
  },
})
