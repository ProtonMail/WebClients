jest.mock('@unleash/proxy-client-react', () => ({
    __esModule: true,
    useFlag: () => {},
    useFlags: () => {},
    useFlagsStatus: () => {},
}));
