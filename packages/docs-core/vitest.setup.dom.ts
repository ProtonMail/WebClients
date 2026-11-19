import '@proton/components/testing/vitest/mockMatchMedia'

// Silence warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn()
