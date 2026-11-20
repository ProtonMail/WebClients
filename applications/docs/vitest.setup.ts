import '@proton/unleash/testing/vitest/mockUnleash'

// Testing Library only advances fake timers through a `jest` global
;(globalThis as any).jest = { advanceTimersByTime: vi.advanceTimersByTime }

// Node < 25 lacks Uint8Array.prototype.toHex, which the crypto library uses
if (!('toHex' in Uint8Array.prototype)) {
  Object.defineProperty(Uint8Array.prototype, 'toHex', {
    value: function toHex(this: Uint8Array<ArrayBuffer>) {
      return Array.from(this, (byte) => byte.toString(16).padStart(2, '0')).join('')
    },
    writable: true,
    configurable: true,
  })
}

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
  __esModule: true,
  loadCryptoWorker: vi.fn(),
}))

vi.mock('@proton/raw-images/createWorker', () => ({
  __esModule: true,
}))

vi.mock('@proton/drive-store/store/_downloads/fileSaver/download', () => ({
  initDownloadSW: vi.fn().mockResolvedValue(true),
}))

vi.mock('@proton/drive-store/utils/metrics/userSuccessMetrics', () => ({
  userSuccessMetrics: {
    init: vi.fn(),
    mark: vi.fn(),
  },
}))
