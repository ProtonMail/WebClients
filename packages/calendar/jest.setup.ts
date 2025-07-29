import '@testing-library/jest-dom/jest-globals';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
    enUSLocale: { code: 'en-US' },
}));

jest.mock('@proton/components/components/v2/phone/flagSvgs', () => ({
    __esModule: true,
    getFlagSvg: () => null,
}));

jest.mock('@proton/components/containers/vpn/flag', () => ({
    __esModule: true,
    flags: {},
    flagsMap: {},
}));

jest.mock('@protontech/bip39', () => ({
    __esModule: true,
    default: () => null,
}));
