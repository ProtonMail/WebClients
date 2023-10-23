jest.mock('@protontech/proxy-client-react', () => ({
    __esModule: true,
    useFlag: jest.fn(),
    useFlags: () => {},
    useFlagsStatus: () => {},
}));
