jest.mock('@unleash/proxy-client-react', () => ({
    __esModule: true,
    useFlag: jest.fn(),
    useFlags: () => {},
    useVariant: () => {},
    useFlagsStatus: () => {},
}));
