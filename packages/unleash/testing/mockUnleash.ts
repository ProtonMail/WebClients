import { vi } from 'vitest';

// Spread the actual module so exports not listed here (FlagProvider, FlagContext…) stay available to consumers.
vi.mock('@unleash/proxy-client-react', async () => ({
    ...(await vi.importActual<typeof import('@unleash/proxy-client-react')>('@unleash/proxy-client-react')),
    __esModule: true,
    useFlag: vi.fn(),
    useUnleashClient: vi.fn().mockReturnValue({
        isEnabled: vi.fn(),
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
