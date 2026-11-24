import '@proton/unleash/testing/vitest/mockUnleash'

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
