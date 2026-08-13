import '@testing-library/jest-dom/jest-globals';

import '@proton/testing/lib/mockFlagSvg';
import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockTelemetry';
import '@proton/testing/lib/mockUnleash';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('@protontech/bip39', () => ({
    __esModule: true,
    default: () => null,
}));
