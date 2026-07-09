vi.mock('@protontech/proxy-client-react', () => ({
    __esModule: true,
    useFlag: vi.fn(),
    useFlags: () => {},
    useFlagsStatus: () => ({ flagsReady: true, flagsError: undefined }),
}));
