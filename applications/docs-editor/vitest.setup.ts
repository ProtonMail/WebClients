import '@proton/vitest-config/setup'
import '@proton/components/testing/mockMatchMedia'
import '@proton/unleash/testing/mockUnleash'

window.ResizeObserver = class {
  observe = vi.fn()

  unobserve = vi.fn()

  disconnect = vi.fn()
} as unknown as typeof ResizeObserver

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
  __esModule: true,
  loadCryptoWorker: vi.fn(),
}))

// Silence DOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn()

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
// The metrics package has its own test coverage, so we don't need to test it here.
vi.mock('@proton/metrics/metricsInstance')
