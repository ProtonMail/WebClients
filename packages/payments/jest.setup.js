import '@proton/testing/lib/mockTelemetry';

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
jest.mock('@proton/metrics');
