import '@testing-library/jest-dom/jest-globals';

import '@proton/app-context/testing/mockTelemetry';
// @proton/components depends on @proton/calendar, so these stay on the @proton/testing
// shims until that cycle is resolved. See INWEB-1236 Phase 7.
import '@proton/testing/lib/mockFlagSvg';
import '@proton/testing/lib/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('@protontech/bip39', () => ({
    __esModule: true,
    default: () => null,
}));
