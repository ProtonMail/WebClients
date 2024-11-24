import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import ConfigProvider from '@proton/components/containers/config/Provider';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { UsePeriodOtpCodeOptions } from '@proton/pass/hooks/usePeriodicOtpCode';
import { type AuthStore } from '@proton/pass/lib/auth/store';
import { preloadPassCoreUI } from '@proton/pass/lib/core/core.ui';
import type { PassCoreProxy } from '@proton/pass/lib/core/types';
import type { ExportOptions } from '@proton/pass/lib/export/types';
import type { I18nService } from '@proton/pass/lib/i18n/service';
import type { ImportReaderPayload } from '@proton/pass/lib/import/types';
import type { MonitorService } from '@proton/pass/lib/monitor/service';
import type { SettingsService } from '@proton/pass/lib/settings/service';
import type { SpotlightProxy } from '@proton/pass/lib/spotlight/service';
import type { ApiState, ClientEndpoint, Maybe, MaybeNull, MaybePromise } from '@proton/pass/types';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import type { TelemetryEvent, TelemetryEventName, TelemetryPlatform } from '@proton/pass/types/data/telemetry';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { AppStateProvider } from './AppStateProvider';

export type PassCoreContextValue = {
    endpoint: ClientEndpoint;
    /** client configuration */
    config: PassConfig;
    /** Core proxy instance */
    core: PassCoreProxy;
    /** i18n service instance */
    i18n: I18nService;
    /** current locale */
    locale: string;
    /** PassMonitor service */
    monitor: MonitorService;
    /** Settings service */
    settings: SettingsService;
    /** Spotlight proxy service */
    spotlight: SpotlightProxy;
    /** Current theme */
    theme: PassThemeOption;
    /** Resolves a users */
    exportData: (options: ExportOptions) => Promise<File>;
    /** In the extension: leverage worker communication to generate
     * a token. In the web-app: use the OTP utils in-place */
    generateOTP: UsePeriodOtpCodeOptions['generate'];
    /** Resolves the api status */
    getApiState?: () => MaybePromise<ApiState>;
    /** Resolves the current tab's parsed url - only relevant for extension */
    getCurrentTabUrl?: () => MaybeNull<ParsedUrl>;
    /** Resolves a domain image as a data URL. Uses an abort signal to
     * cancel the image request if the image component is unmounted,
     * applying back-pressure when users scroll rapidly through items */
    getDomainImage: (domain: string, signal: AbortSignal) => Promise<Maybe<string>>;
    /** Resolves the locally stored app logs */
    getLogs: () => Promise<string[]>;
    /** Returns the URL that should be opened when prompting for rating */
    getRatingURL?: () => string;
    /** Resolves the initial theme. This is required in order to resolve
     * the proxied theme setting stored locally before state hydration */
    getTheme: () => Promise<Maybe<PassThemeOption>>;
    setTheme: (theme: PassThemeOption) => void;
    /** defines how a client handles external links.
     * In extension, this will leverage the `browser.tabs` API
     * whereas in the web-app, we can use `window.location` */
    onLink: (url: string, options?: { replace?: boolean }) => void;
    /** Processes a telemetry event */
    onTelemetry: <T extends TelemetryEventName>(
        Event: T,
        Values: TelemetryEvent<T>['Values'],
        Dimensions: TelemetryEvent<T>['Dimensions'],
        platform?: TelemetryPlatform
    ) => void;
    /** Processes an event for B2B users only */
    onB2BEvent: (event: B2BEvent) => void;
    /* Will get called when user tries to update a client manually */
    onForceUpdate?: () => void;
    /** Open the settings view at a particular page */
    openSettings?: (page?: string) => void;
    /** This allows processing an import reader payload before feeding
     * it to the import readers. Used to process encrypted import files. */
    prepareImport: (payload: ImportReaderPayload) => Promise<ImportReaderPayload>;
    /** Prompts for client specific permissions */
    promptForPermissions?: () => void;
    /** Sets the current tab's url - only relevant for extension */
    setCurrentTabUrl?: (url: ParsedUrl) => void;
    /** Writes text to the clipboard */
    writeToClipboard: (text: string) => Promise<void>;
    /** Gets the unlock key via biometrics */
    getBiometricsKey?: (authStore: AuthStore) => Promise<MaybeNull<string>>;
    /** Checks if this is the first time Pass is being launched */
    isFirstLaunch?: () => boolean;
};

export type PassCoreProviderProps = Omit<PassCoreContextValue, 'locale' | 'theme' | 'setTheme'> & { wasm?: boolean };

export const PassCoreContext = createContext<MaybeNull<PassCoreContextValue>>(null);

/** The `PassCoreProvider` must be made available on all pass
 * clients : it provides implementations for processes that are
 * dependent on the platform. */
export const PassCoreProvider: FC<PropsWithChildren<PassCoreProviderProps>> = ({ children, wasm, ...core }) => {
    const [appLocale, setAppLocale] = useState(DEFAULT_LOCALE);
    const [theme, setTheme] = useState<PassThemeOption>(PASS_DEFAULT_THEME);

    const context = useMemo<PassCoreContextValue>(
        () => ({ ...core, theme, setTheme, locale: appLocale }),
        [appLocale, theme]
    );

    useEffect(() => {
        if (wasm) preloadPassCoreUI()?.catch(noop);

        core
            .getTheme?.()
            .then((initial) => setTheme(initial ?? PASS_DEFAULT_THEME))
            .catch(noop);

        core.i18n.setLocale().catch(noop);
        core.i18n.subscribe(({ locale }) => setAppLocale(locale));

        const client = ['desktop', 'web'].includes(core.endpoint) ? core.endpoint : 'extension';
        document.body.classList.add(`pass-${client}`);
    }, []);

    return (
        <ConfigProvider config={core.config}>
            <PassCoreContext.Provider value={context}>
                <ThemeProvider theme={theme} />
                <AppStateProvider>{children}</AppStateProvider>
            </PassCoreContext.Provider>
        </ConfigProvider>
    );
};

export const usePassCore = (): PassCoreContextValue => useContext(PassCoreContext)!;
