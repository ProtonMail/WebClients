jest.mock('@unleash/proxy-client-react', () => ({
    __esModule: true,
    useFlag: jest.fn(),
    useUnleashClient: jest.fn(),
    useFlags: () => {},
    useVariant: () => {},
    useFlagsStatus: () => {},
}));
