import '@testing-library/jest-dom';
import '@proton/app-context/testing/vitest/mockTelemetry';
import '@proton/unleash/testing/vitest/mockUnleash';

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Some hooks use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
// For instance, a test covering a hook with metrics might finish successfully, but a subsequent test
// could fail seconds later when the metrics batch is sent via fetch.
// The metrics package has its own test coverage, so we don't need to test it here.
vi.mock('@proton/metrics/metricsInstance');

// happy-dom's AbortSignal.any relies on `this`, but the code under test uses it unbound (as browsers allow).
if (typeof AbortSignal.any === 'function') {
    AbortSignal.any = AbortSignal.any.bind(AbortSignal);
}
