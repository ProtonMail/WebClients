import '@proton/app-context/testing/vitest/mockTelemetry';

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
vi.mock('@proton/metrics/metricsInstance');
