import { createContext } from 'react';

import { createUseContext } from '../../hooks/useContextFactory';
import type { UsePeriodOtpCodeOptions } from '../../hooks/useOTPCode';
import type { PassConfig } from '../../hooks/usePassConfig';
import type { AuthStore } from '../../lib/auth/store';
import type { PassCoreProxy } from '../../lib/core/core.types';
import type { I18nService } from '../../lib/i18n/service';
import type { MonitorService } from '../../lib/monitor/service';
import type { ConnectivityService } from '../../lib/network/connectivity.service';
import type { SettingsService } from '../../lib/settings/service';
import type { SpotlightProxy } from '../../lib/spotlight/service';
import type { SshAgentService } from '../../lib/ssh-agent/service';
import type { ParsedUrl } from '../../lib/urls/types';
import type { ClientEndpoint, ContextBridgeApi, Maybe, MaybeNull, TabId } from '../../types';
import type { B2BEvent } from '../../types/data/b2b';
import type { OnTelemetryEvent } from '../../types/data/telemetry';
import type { EventDispatcher } from '../../utils/event/dispatcher';
import type { PassThemeService } from '../Layout/Theme/ThemeService';

export interface PopupController {
    /** Opens popup in new window */
    expand: (subpath?: string) => void;
    /** `true` if popup is opened in a new window */
    expanded: boolean;
}

export type ExtensionClientState = {
    /** Parsed URL of the underlying active tab */
    url: MaybeNull<ParsedUrl>;
    /** Title of the underlying active browser tab */
    title: MaybeNull<string>;
    /** tabID of the current context window */
    tabId?: TabId;
    /** Port name of the current client */
    port: string;
};

export type PassCoreContextValue = {
    endpoint: ClientEndpoint;
    /** client configuration */
    config: PassConfig;
    /** connectivity service/proxy */
    connectivity: ConnectivityService;
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
    onTelemetry: OnTelemetryEvent;
    /** Processes an event for B2B users only */
    onB2BEvent: EventDispatcher<B2BEvent>['push'];
    /* Will get called when user tries to update a client manually */
    onForceUpdate?: () => void;
    /** Open the settings view at a particular page */
    openSettings: (page?: string) => void;
    /** Sets the current tab's url - only relevant for extension */
    setExtensionClientState?: (current: ExtensionClientState) => void;
    /** Writes text to the clipboard. `promptForPermissions` should only be used
     * for prompting clipboard permissions in extensions when setting up a TTL
     * as part of an on-going `writeToClipboard` request. (see: ClipboardSettingsModal.tsx) */
    writeToClipboard: (text: string, clipboardTTL: Maybe<number>, promptForPermissions?: boolean) => Promise<boolean>;
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
    /** Request desktop unlock secret, only relevant for extension */
    getDesktopUnlockSecret?: () => Promise<string>;
    /** SSH agent service, only relevant for desktop */
    sshAgent?: MaybeNull<SshAgentService>;
};

export type PassCoreProviderProps = PassCoreContextValue & { wasm?: boolean; bridge?: ContextBridgeApi };

export const PassCoreContext = createContext<MaybeNull<PassCoreContextValue>>(null);

export const usePassCore = createUseContext(PassCoreContext);

export const useCurrentTabID = (): Maybe<TabId> => {
    const { getExtensionClientState } = usePassCore();
    return getExtensionClientState?.()?.tabId;
};

export const useCurrentPort = (): Maybe<string> => {
    const { getExtensionClientState } = usePassCore();
    return getExtensionClientState?.()?.port;
};
