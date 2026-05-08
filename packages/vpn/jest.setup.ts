import '@testing-library/jest-dom';

import './jest.mock';

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({ __esModule: true }));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('@proton/components/containers/vpn/flag', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));

jest.mock('@proton/components/components/v2/phone/flagSvgs', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));
