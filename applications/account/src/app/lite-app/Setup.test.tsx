import { render, waitFor } from '@testing-library/react';

import Setup from './Setup';
import { SupportedActions } from './helper';

const mockLoadLocales = vi.fn();
const mockUserSettingsThunk = vi.fn();
const mockGetBrowserLocale = vi.fn();
const mockDispatch = vi.fn();

vi.mock('@proton/shared/lib/i18n/loadLocale', () => ({
    loadLocales: (args: any) => mockLoadLocales(args),
}));
vi.mock('@proton/shared/lib/i18n/helper', () => ({
    getBrowserLocale: () => mockGetBrowserLocale(),
}));
vi.mock('@proton/shared/lib/i18n/locales', () => ({ locales: {} }));
vi.mock('@proton/account/userSettings', () => ({
    userSettingsThunk: () => mockUserSettingsThunk,
}));
vi.mock('@proton/account/user', () => ({ userThunk: () => 'userThunk' }));
vi.mock('../private-app/store/hooks', () => ({
    useAccountDispatch: () => mockDispatch,
}));
vi.mock('../private-app/store/store', () => ({ extendStore: vi.fn() }));
vi.mock('../private-app/store/thunk', () => ({
    extraThunkArguments: {
        authentication: {},
        unleashClient: {},
        eventManager: {},
        api: vi.fn(),
    },
}));
vi.mock('@proton/account/bootstrap', () => ({
    createUnleash: vi.fn(),
    unleashReady: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@proton/account/eventLoop', () => ({ serverEvent: vi.fn() }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({}) }));
vi.mock('@proton/components/hooks/useErrorHandler', () => ({
    default: () => vi.fn(),
}));
vi.mock('@proton/components/containers/themes/useThemeQueryParameter', () => ({
    default: vi.fn(),
}));
vi.mock('@proton/components/containers/api/ApiProvider', () => ({
    default: ({ children }: any) => children,
}));
vi.mock('@proton/components/containers/eventManager/EventManagerProvider', () => ({
    default: ({ children }: any) => children,
}));
vi.mock('@proton/components/containers/modals/Children', () => ({
    default: () => null,
}));
vi.mock('@proton/components/containers/notifications/Children', () => ({
    default: () => null,
}));
vi.mock('@proton/components/containers/app/StandardLoadErrorPage', () => ({
    default: ({ errorMessage }: any) => <div>{errorMessage}</div>,
}));
vi.mock('@proton/unleash/UnleashFlagProviderWithToolbar', () => ({
    UnleashFlagProviderWithToolbar: ({ children }: any) => children,
}));
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    loadCryptoWorker: vi.fn(),
}));
vi.mock('@proton/shared/lib/eventManager/eventManager', () => ({
    default: () => ({ subscribe: vi.fn(), start: vi.fn() }),
}));
vi.mock('@proton/metrics/metricsInstance', () => ({
    default: { setReportMetrics: vi.fn() },
}));
vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    setSentryEnabled: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/metrics', () => ({
    setMetricsEnabled: vi.fn(),
}));
vi.mock('@proton/shared/lib/telemetry', () => ({
    telemetry: { init: vi.fn() },
}));
vi.mock('./broadcast', () => ({
    default: vi.fn(),
    MessageType: { LOADED: 'LOADED', ERROR: 'ERROR' },
}));

const renderSetup = (props: { language: string | null; action: SupportedActions | null }) =>
    render(
        <Setup api={vi.fn() as any} UID="uid" onLogin={vi.fn()} loader={<div>loader</div>} {...props}>
            <div>content</div>
        </Setup>
    );

const getRequestedLocale = async () => {
    await waitFor(() => expect(mockLoadLocales).toHaveBeenCalled());
    return mockLoadLocales.mock.calls[0][0].locale;
};

describe('Setup locale', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetBrowserLocale.mockReturnValue('fr-FR');
        mockDispatch.mockImplementation(async (thunk: unknown) => {
            if (thunk === mockUserSettingsThunk) {
                return mockUserSettingsThunk();
            }
            return {};
        });
        mockUserSettingsThunk.mockResolvedValue({ Locale: 'de_DE' });
    });

    it('uses the language asked for by the client first', async () => {
        renderSetup({ language: 'es_ES', action: SupportedActions.BYOEMobile });

        expect(await getRequestedLocale()).toBe('es_ES');
        expect(mockUserSettingsThunk).not.toHaveBeenCalled();
    });

    it('uses the locale of the account when the client asks for no language', async () => {
        renderSetup({ language: null, action: SupportedActions.BYOEMobile });

        expect(await getRequestedLocale()).toBe('de_DE');
    });

    it('falls back to the browser locale when the user settings cannot be read', async () => {
        mockUserSettingsThunk.mockRejectedValue(new Error('nope'));

        renderSetup({ language: null, action: SupportedActions.BYOEMobile });

        expect(await getRequestedLocale()).toBe('fr-FR');
    });

    it('falls back to the browser locale when the account has no locale', async () => {
        mockUserSettingsThunk.mockResolvedValue({ Locale: '' });

        renderSetup({ language: null, action: SupportedActions.BYOEMobile });

        expect(await getRequestedLocale()).toBe('fr-FR');
    });

    it('does not read the user settings of an action that does not support it', async () => {
        renderSetup({ language: null, action: SupportedActions.AccountSettings });

        expect(await getRequestedLocale()).toBe('fr-FR');
        expect(mockUserSettingsThunk).not.toHaveBeenCalled();
    });
});
