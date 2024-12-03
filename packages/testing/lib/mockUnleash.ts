jest.mock('@unleash/proxy-client-react', () => ({
    __esModule: true,
    useFlag: jest.fn(),
    useUnleashClient: jest.fn().mockReturnValue({
        isEnabled: jest.fn(),
    }),
    useFlags: () => {},
    useVariant: () => {
        return { name: 'disabled' };
    },
    useFlagsStatus: () => {},
}));
