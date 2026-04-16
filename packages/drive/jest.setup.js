import '@testing-library/jest-dom';

import '@proton/testing/lib/mockMatchMedia';

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
}));

// Suppress console noise from drive-sdk telemetry during tests.
jest.spyOn(console, 'debug').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock VPN flag to prevent those issues
// TypeError: require.context is not a function
// > 1 | const flags = require.context('@proton/styles/assets/img/flags', true, /.svg$/);
jest.mock('@proton/components/containers/vpn/flag', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));
jest.mock('@proton/components/components/v2/phone/flagSvgs', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));
