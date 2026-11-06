import '@testing-library/jest-dom';

import '@proton/app-context/testing/mockTelemetry';
import '@proton/unleash/testing/mockUnleash';

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// Some hooks use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
// For instance, a test covering a hook with metrics might finish successfully, but a subsequent test
// could fail seconds later when the metrics batch is sent via fetch.
// The metrics package has its own test coverage, so we don't need to test it here.
jest.mock('@proton/metrics/metricsInstance');
