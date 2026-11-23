import { useEffect } from 'react';

import { render, waitFor } from '@testing-library/react';

import LiteApp from './LiteApp';

const setupProps = vi.fn();
let setupMounts = 0;

const MockSetup = (props: { UID?: string; onLogin: (UID: string) => void; language: string | null; children: any }) => {
    setupProps({
        UID: props.UID,
        language: props.language,
    });

    // Same as the real Setup: clear the hash, then log in. Logging in changes the UID and remounts Setup.
    useEffect(() => {
        setupMounts++;
        window.location.hash = '';
        if (!props.UID) {
            props.onLogin('uid');
        }
    }, []);

    return props.UID ? props.children : null;
};

vi.mock('./Setup', () => ({
    default: (props: any) => <MockSetup {...props} />,
}));

vi.mock('@proton/account/bootstrap', () => ({
    init: vi.fn(),
    createAuthentication: () => ({
        UID: undefined,
        setUID: vi.fn(),
        mode: 'standalone',
    }),
}));
vi.mock('@proton/shared/lib/api/createApi', () => ({ default: () => vi.fn() }));
vi.mock('@proton/shared/lib/api/helpers/customConfig', () => ({
    getSilentApi: vi.fn(),
}));
vi.mock('@proton/telemetry-tracker/lib/tracker', () => ({
    initTracker: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/initSafariFontFixClassnames', () => ({
    initSafariFontFixClassnames: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/sentry', () => ({ setUID: vi.fn() }));
vi.mock('@proton/metrics/metricsInstance', () => ({
    default: { setAuthHeaders: vi.fn() },
}));
vi.mock('../private-app/store/store', () => ({
    setupStore: () => ({ dispatch: vi.fn() }),
    extendStore: vi.fn(),
}));
vi.mock('@proton/redux-shared-store/sharedProvider', () => ({
    ProtonStoreProvider: ({ children }: any) => children,
}));
vi.mock('./components/LiteLayout', () => ({
    default: ({ children }: any) => children,
}));
vi.mock('./components/LiteLoaderPage', () => ({ default: () => null }));
vi.mock('./LegacyLiteAppBaseRoute', () => ({
    default: () => <div>base route</div>,
}));
vi.mock('./LiteAppRouter', () => ({ default: () => null }));

describe('LiteApp language', () => {
    beforeEach(() => {
        setupProps.mockClear();
        setupMounts = 0;
    });

    // Regression: the language lives in the hash, which Setup clears, and Setup remounts once the UID is set after login.
    // The remounted Setup used to load the browser locale instead of the requested one.
    it.each([
        ['the hash', '/lite?action=byoe-mobile#selector=abc&sk=def&language=es_ES'],
        ['the query', '/lite?action=byoe-mobile&language=es_ES#selector=abc&sk=def'],
    ])('keeps the language from %s after Setup clears the hash and remounts', async (_, url) => {
        window.history.replaceState({}, '', url);

        render(<LiteApp />);

        await waitFor(() =>
            expect(setupProps).toHaveBeenCalledWith({
                UID: 'uid',
                language: 'es_ES',
            })
        );
        expect(setupMounts).toBe(2);
        expect(window.location.hash).toBe('');
        expect(setupProps.mock.calls.every(([props]) => props.language === 'es_ES')).toBe(true);
    });

    it('passes no language when the URL has none', async () => {
        window.history.replaceState({}, '', '/lite?action=byoe-mobile#selector=abc&sk=def');

        render(<LiteApp />);

        await waitFor(() =>
            expect(setupProps).toHaveBeenCalledWith({
                UID: 'uid',
                language: null,
            })
        );
    });
});
