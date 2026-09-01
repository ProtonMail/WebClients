// Mock VPN flag to prevent those issues
// TypeError: require.context is not a function
// > 1 | const flags = require.context('@proton/styles/assets/img/flags', true, /.svg$/);

vi.mock('../../containers/vpn/flag', () => ({
    getFlagSvg: vi.fn().mockImplementation((it) => it),
}));

vi.mock('../../components/v2/phone/flagSvgs', () => ({
    getFlagSvg: vi.fn().mockImplementation((it) => it),
}));

export {};
