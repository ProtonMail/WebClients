import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import ConfigProvider from '@proton/components/containers/config/Provider';
import useInstance from '@proton/hooks/useInstance';
import { PassThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import type { PassThemeService } from '@proton/pass/components/Layout/Theme/ThemeService';
import type { UsePeriodOtpCodeOptions } from '@proton/pass/hooks/useOTPCode';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { type AuthStore } from '@proton/pass/lib/auth/store';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import { preloadPassUI } from '@proton/pass/lib/core/ui.proxy';
import type { I18nService } from '@proton/pass/lib/i18n/service';
import type { MonitorService } from '@proton/pass/lib/monitor/service';
import type { SettingsService } from '@proton/pass/lib/settings/service';
import type { SpotlightProxy } from '@proton/pass/lib/spotlight/service';
import type { ApiState, ClientEndpoint, Maybe, MaybeNull, MaybePromise, TabId } from '@proton/pass/types';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import type { TelemetryEvent, TelemetryEventName, TelemetryPlatform } from '@proton/pass/types/data/telemetry';
import type { EventDispatcher } from '@proton/pass/utils/event/dispatcher';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import noop from '@proton/utils/noop';

import { AppStateProvider } from './AppStateProvider';

export interface PopupController {
    /** Opens popup in new window */
    expand: (subpath?: string) => void;
    /** `true` if popup is opened in a new window */
    expanded: boolean;
}

export type ExtensionClientState = {
    /** Parsed URL of the underlying active tab */
    url: MaybeNull<ParsedUrl>;
    /** tabID of the current context window */
    tabId?: TabId;
    /** Port name of the current client */
    port: string;
};

export type PassCoreContextValue = {
    endpoint: ClientEndpoint;
    /** client configuration */
    config: PassConfig;
    /** Core proxy instance */
    core: PassCoreProxy;
    /** i18n service instance */
    i18n: I18nService;
    /** PassMonitor service */
    monitor: MonitorService;
    /** Settings service */
    settings: SettingsService;
    /** Spotlight proxy service */
    spotlight: SpotlightProxy;
    /** Theme manager */
    theme: PassThemeService;
    /** In the extension: leverage worker communication to generate
     * a token. In the web-app: use the OTP utils in-place */
    generateOTP: UsePeriodOtpCodeOptions['generate'];
    /** Resolves the api status */
    getApiState?: () => MaybePromise<ApiState>;
    /** Resolves the current tab's parsed url - only relevant for extension */
    getExtensionClientState?: () => MaybeNull<ExtensionClientState>;
    /** Resolves a domain image as a data URL. Uses an abort signal to
     * cancel the image request if the image component is unmounted,
     * applying back-pressure when users scroll rapidly through items */
    getDomainImage: (domain: string, signal: AbortSignal) => Promise<Maybe<string>>;
    /** Resolves the locally stored app logs */
    getLogs: () => Promise<string[]>;
    /** Returns the URL that should be opened when prompting for rating */
    getRatingURL?: () => string;
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
    onB2BEvent: EventDispatcher<B2BEvent>['push'];
    /* Will get called when user tries to update a client manually */
    onForceUpdate?: () => void;
    /** Open the settings view at a particular page */
    openSettings?: (page?: string) => void;
    /** Prompts for client specific permissions */
    promptForPermissions?: () => void;
    /** Sets the current tab's url - only relevant for extension */
    setExtensionClientState?: (current: ExtensionClientState) => void;
    /** Writes text to the clipboard */
    writeToClipboard: (text: string) => Promise<void>;
    /** Checks whether biometrics functionalities can be used */
    supportsBiometrics?: () => Promise<boolean>;
    /** Gets the unlock key via biometrics */
    getBiometricsKey?: (authStore: AuthStore) => Promise<MaybeNull<string>>;
    /** Generates the unlock key for biometrics */
    generateBiometricsKey?: () => Promise<CryptoKey>;
    /** Checks if this is the first time Pass is being launched */
    isFirstLaunch?: () => boolean;
    /** Only relevant for extension */
    popup?: PopupController;
};

export type PassCoreProviderProps = PassCoreContextValue & { wasm?: boolean };
export const PassCoreContext = createContext<MaybeNull<PassCoreContextValue>>(null);

/** The `PassCoreProvider` must be made available on all pass
 * clients : it provides implementations for processes that are
 * dependent on the platform. */
export const PassCoreProvider: FC<PropsWithChildren<PassCoreProviderProps>> = ({ children, wasm, ...core }) => {
    const [initialized, setInitialized] = useState(!wasm);
    const context = useInstance<PassCoreContextValue>(() => core);

    useEffect(() => {
        const client = ['desktop', 'web'].includes(core.endpoint) ? core.endpoint : 'extension';
        document.body.classList.add(`pass-${client}`);

        if (wasm) {
            preloadPassUI()
                ?.catch(noop)
                .finally(() => setInitialized(true));
        }
    }, []);

    return (
        <ConfigProvider config={core.config}>
            <PassCoreContext.Provider value={context}>
                <PassThemeProvider>
                    <AppStateProvider>{initialized && children}</AppStateProvider>
                </PassThemeProvider>
            </PassCoreContext.Provider>
        </ConfigProvider>
    );
};

export const usePassCore = (): PassCoreContextValue => useContext(PassCoreContext)!;

export const useCurrentTabID = (): Maybe<TabId> => {
    const { getExtensionClientState } = usePassCore();
    return getExtensionClientState?.()?.tabId;
};

export const useCurrentPort = (): Maybe<string> => {
    const { getExtensionClientState } = usePassCore();
    return getExtensionClientState?.()?.port;
};
