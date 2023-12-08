jest.mock('@unleash/proxy-client-react', () => ({
    __esModule: true,
    useFlag: vi.fn(),
    useFlags: () => {},
    useVariant: () => {},
    useFlagsStatus: () => {},
}));
