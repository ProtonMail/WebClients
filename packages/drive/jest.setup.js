import '@testing-library/jest-dom';

import '@proton/testing/lib/mockFlagSvg';
import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockTelemetry';

// Suppress console noise from drive-sdk telemetry during tests.
jest.spyOn(console, 'debug').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));
