jest.mock('@unleash/proxy-client-react', () => ({
    __esModule: true,
    useFlag: jest.fn(),
    useUnleashClient: jest.fn().mockReturnValue({
        isEnabled: jest.fn(),
    }),
    useFlags: () => {},
    useVariant: () => ({
        name: 'disabled',
    }),
    useFlagsStatus: () => ({ flagsReady: true, flagsError: undefined }),
    UnleashClient: class UnleashClient {
        isEnabled = () => true;
    },
}));
