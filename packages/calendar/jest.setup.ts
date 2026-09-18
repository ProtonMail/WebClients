import '@testing-library/jest-dom/jest-globals';

import '@proton/app-context/testing/mockTelemetry';
import '@proton/unleash/testing/mockUnleash';

import './testing/setup/mockFlagSvg';
import './testing/setup/mockMatchMedia';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('@protontech/bip39', () => ({
    __esModule: true,
    default: () => null,
}));
