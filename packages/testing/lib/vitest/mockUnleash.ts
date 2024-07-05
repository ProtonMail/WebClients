vi.mock('@protontech/proxy-client-react', () => ({
    __esModule: true,
    useFlag: vi.fn(),
    useFlags: () => {},
    useFlagsStatus: () => {},
}));
