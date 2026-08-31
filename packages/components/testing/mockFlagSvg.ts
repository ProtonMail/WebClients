// Mock VPN flag to prevent those issues
// TypeError: require.context is not a function
// > 1 | const flags = require.context('@proton/styles/assets/img/flags', true, /.svg$/);

jest.mock('../containers/vpn/flag', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));

jest.mock('../components/v2/phone/flagSvgs', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));

export {};
