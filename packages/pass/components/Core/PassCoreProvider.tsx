import type { FC } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { ConfigProvider } from '@proton/components/containers/config';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { UsePeriodOtpCodeOptions } from '@proton/pass/hooks/usePeriodicOtpCode';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';

type PassCoreContextValue = {
    config: PassConfig;
    /** In the extension: leverage worker communication to generate
     * a token. In the web-app: use the OTP utils in-place */
    generateOTP: UsePeriodOtpCodeOptions['generate'];
    /* Defines how the item domain image URLs should be built */
    getDomainImageURL: (domain?: string) => Maybe<string>;
    /** defines how a client handles external links.
     * In extension, this will leverage the `browser.tabs` API
     * whereas in the web-app, we can use `window.location` */
    onLink: (url: string) => void;
    /** Processes a telemetry event */
    onTelemetry: (event: TelemetryEvent) => void;
};

const PassCoreContext = createContext<MaybeNull<PassCoreContextValue>>(null);

/** The `PassCoreProvider` must be made available on all pass
 * clients : it provides implementations for processes that are
 * dependent on the platform. */
export const PassCoreProvider: FC<PassCoreContextValue> = ({ children, ...core }) => (
    <ConfigProvider config={core.config}>
        <PassCoreContext.Provider value={useMemo(() => core, [])}>{children}</PassCoreContext.Provider>
    </ConfigProvider>
);

export const usePassCore = (): PassCoreContextValue => useContext(PassCoreContext)!;
