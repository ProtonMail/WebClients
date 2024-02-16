import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { ConfigProvider } from '@proton/components/containers/config';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { UsePeriodOtpCodeOptions } from '@proton/pass/hooks/usePeriodicOtpCode';
import type { ExportOptions } from '@proton/pass/lib/export/types';
import type { I18nService } from '@proton/pass/lib/i18n/service';
import type { ImportReaderPayload } from '@proton/pass/lib/import/types';
import type { ClientEndpoint, Maybe, MaybeNull, MaybePromise, OnboardingMessage } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { ParsedUrl } from '@proton/pass/utils/url/parser';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export type PassCoreContextValue = {
    endpoint: ClientEndpoint;
    /** client configuration */
    config: PassConfig;
    /** i18n service instance */
    i18n: I18nService;
    /** current locale */
    locale: string;
    /** Resolves a users */
    exportData: (options: ExportOptions) => Promise<File>;
    /** In the extension: leverage worker communication to generate
     * a token. In the web-app: use the OTP utils in-place */
    generateOTP: UsePeriodOtpCodeOptions['generate'];
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
    /** defines how a client handles external links.
     * In extension, this will leverage the `browser.tabs` API
     * whereas in the web-app, we can use `window.location` */
    onLink: (url: string, options?: { replace?: boolean }) => void;
    /** Processes a telemetry event */
    onTelemetry: (event: TelemetryEvent) => void;
    /** Acknowledge an onboarding message*/
    onboardingAcknowledge?: (type: OnboardingMessage) => MaybePromise<void | boolean>;
    /** Check if an onboarding message should show */
    onboardingCheck?: (type: OnboardingMessage) => MaybePromise<boolean>;
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
};

const PassCoreContext = createContext<MaybeNull<PassCoreContextValue>>(null);

/** The `PassCoreProvider` must be made available on all pass
 * clients : it provides implementations for processes that are
 * dependent on the platform. */
export const PassCoreProvider: FC<PropsWithChildren<Omit<PassCoreContextValue, 'locale'>>> = ({
    children,
    ...core
}) => {
    const [appLocale, setAppLocale] = useState(DEFAULT_LOCALE);
    const context = useMemo<PassCoreContextValue>(() => ({ ...core, locale: appLocale }), [appLocale]);

    useEffect(() => {
        core.i18n.getLocale().then(core.i18n.setLocale).catch(noop);
        core.i18n.subscribe(({ locale }) => setAppLocale(locale));

        const client = ['desktop', 'web'].includes(core.endpoint) ? core.endpoint : 'extension';
        document.body.classList.add(`pass-${client}`);
    }, []);

    return (
        <ConfigProvider config={core.config}>
            <PassCoreContext.Provider value={context}>{children}</PassCoreContext.Provider>
        </ConfigProvider>
    );
};

export const usePassCore = (): PassCoreContextValue => useContext(PassCoreContext)!;
