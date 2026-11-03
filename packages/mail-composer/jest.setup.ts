import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import '@proton/components/testing/mockFlagSvg';
import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

// jsdom does not provide them, and @protontech/crypto needs them
Object.assign(global, { TextDecoder, TextEncoder });

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('@proton/components/hooks/useEventManager', () => {
    const subscribe = jest.fn();
    const call = jest.fn();
    const stop = jest.fn();
    const start = jest.fn();

    const result = () => ({ subscribe, call, stop, start });

    return Object.assign(result, { subscribe, call, stop, start });
});

jest.mock('@proton/components/components/modalTwo/BackdropContainer', () => ({
    __esModule: true,
    default: () => null,
}));
