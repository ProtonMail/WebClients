import { type PropsWithChildren, createContext, useContext, useEffect, useRef, useState } from 'react';

import type { ConnectBYOEAddressFailure } from '@proton/activation/src/byoe/connectBYOEAddress.interface';
import { useBYOEGating } from '@proton/activation/src/byoe/useBYOEGating';
import { useOAuthRedirectFlow } from '@proton/activation/src/byoe/useOAuthRedirectFlow';
import { getBYOEDisabledNotification, getGenericLimitReached } from '@proton/activation/src/constants';
import type { BYOEAddressLimit } from '@proton/activation/src/helpers/byoeAddresses';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import {
    getBYOECreationStartedAt,
    resumeBYOECreation,
    trackBYOECreationStarted,
    trackBYOEGoogleSignInClicked,
} from '@proton/activation/src/telemetry/byoeCreationFunnel';
import { useNotifications } from '@proton/app-context/useNotifications';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { getNativeUpsellUrl } from '../redirectToNative';
import { useBYOEMobileTelemetry } from '../telemetry/useBYOEMobileTelemetry';
import { type BYOEMobileStatus, REDIRECT_PATH } from './interface';
import { type ClaimableFailure, useBYOEMobileConnection } from './useBYOEMobileConnection';

interface BYOEMobileContextValue {
    status: BYOEMobileStatus;
    isLoading: boolean;
    defaultImportEmails: boolean;
    /** Which address limit the user reached, if any. Undefined while loading or when they can still add one. */
    limitReached: BYOEAddressLimit | undefined;
    connectingEmail: string | undefined;
    /** Why the last attempt failed, until the user dismisses it. */
    error: ConnectBYOEAddressFailure | null;
    dismissError: () => void;
    /** Starts the OAuth flow again with the choices of the previous attempt. */
    retry: () => void;
    /** Connects an address used on another account, once the user confirmed it. */
    claimAddress: (failure: ClaimableFailure) => Promise<void>;
    canStartOAuthFlow: () => boolean;
    /** Reconnects a disconnected address. Reconnecting counts as adding one, so the same checks apply. */
    reconnectAddress: (address: Address) => Promise<void>;
    startOAuthFlowIfAllowed: (importEmails: boolean) => void;
}

const BYOEMobileContext = createContext<BYOEMobileContextValue | undefined>(undefined);

export const useBYOEMobile = () => {
    const context = useContext(BYOEMobileContext);
    if (!context) {
        throw new Error('useBYOEMobile must be used inside BYOEMobileProvider');
    }
    return context;
};

interface Props extends PropsWithChildren {
    /** Native app URL to hand control back to once the address is connected. */
    redirect: string | undefined;
    /** Search params from the first load: the URL is rewritten by the login flow before this component mounts. */
    initialSearchParams: URLSearchParams;
}

const getAutoConnectParams = (params: URLSearchParams) => {
    return {
        autoConnect: params.get('autoconnect') === '1',
        importEmails: params.get('importEmails') !== '0',
    };
};

export const BYOEMobileProvider = ({ redirect, initialSearchParams, children }: Props) => {
    const { UID, localID } = useAuthentication();
    const { createNotification } = useNotifications();

    const { isLoadingGating, checkGating } = useBYOEGating();

    const { callback, redirectUri, startOAuthFlow } = useOAuthRedirectFlow({
        features: [EASY_SWITCH_FEATURES.BYOE],
        redirectPath: REDIRECT_PATH,
    });

    const telemetry = useBYOEMobileTelemetry();

    const hasAutoStartedRef = useRef(false);
    const hasTrackedViewRef = useRef(false);
    const hasHandledCallbackRef = useRef(false);

    // Read once: `initialSearchParams` is a snapshot of the first load and never changes
    const [autoParams] = useState(() => getAutoConnectParams(initialSearchParams));
    const [status, setStatus] = useState<BYOEMobileStatus>(() => {
        if (callback.type === 'code') {
            return 'connecting';
        }
        return autoParams.autoConnect && callback.type === 'none' ? 'auto-starting' : 'idle';
    });

    const {
        connectingEmail,
        error,
        dismissError,
        getLastImportEmails,
        handleOAuthCallback,
        claimAddress,
        reconnectAddress: reconnectWithExistingPermission,
    } = useBYOEMobileConnection({
        redirectUri,
        defaultImportEmails: autoParams.importEmails,
        setStatus,
    });

    // Every action of the screen is disabled while one is running, so two can never overlap
    const isLoading = status === 'starting-oauth' || status === 'reconnecting' || isLoadingGating;

    // Without a valid native redirect there is nobody to show the upsell to, so the generic limit message applies
    const upsellUrl = getNativeUpsellUrl(redirect);

    // The gating outcome is undefined while the gating check is loading, so the button copy can be determined immediately.
    // A free user without upsell URL gets no limit state: the button stays "Connect" and the click shows the generic toast.
    const gatingOutcome = isLoadingGating ? undefined : checkGating();
    const getLimitReached = (): BYOEAddressLimit | undefined => {
        if (gatingOutcome === 'free-limit') {
            return upsellUrl ? gatingOutcome : undefined;
        }
        return gatingOutcome === 'paid-limit' ? gatingOutcome : undefined;
    };
    const limitReached = getLimitReached();

    const startOAuthFlowNow = (importEmails: boolean) => {
        // The page navigates away right after, so the telemetry event must be sent before starting the flow.
        trackBYOEGoogleSignInClicked({ hasImportEmails: importEmails, importPeriod: undefined });
        telemetry.trackConnectStarted(importEmails);
        // The page navigates away, so the auto-starting status is intentionally never reset.
        setStatus(status === 'auto-starting' ? 'auto-starting' : 'starting-oauth');
        startOAuthFlow({
            importEmails,
            redirect,
            sessionUID: UID,
            sessionLocalID: localID,
            creationStartedAt: getBYOECreationStartedAt(),
        });
    };

    // The address already has its messages and the user stays on the page afterwards: nothing to import or hand back
    const startReconnectOAuthFlow = (address: Address) => {
        // The page navigates away, so the status is intentionally never reset.
        setStatus('starting-oauth');
        startOAuthFlow({
            importEmails: false,
            reconnectAddressID: address.ID,
            sessionUID: UID,
            sessionLocalID: localID,
        });
    };

    const canStartOAuthFlow = (): boolean => {
        const outcome = checkGating();
        if (outcome === 'ok') {
            return true;
        }

        if (outcome === 'free-limit' && upsellUrl) {
            replaceUrl(upsellUrl);
            return false;
        }

        if (outcome === 'feature-disabled' || outcome === 'no-access') {
            createNotification(getBYOEDisabledNotification());
            // We still handle the 'free-limit' and 'paid-limit' here in case of missing redirect URL or uncaught click
        } else if (outcome === 'free-limit' || outcome === 'paid-limit') {
            createNotification(getGenericLimitReached());
        }

        return false;
    };

    // Telemetry: the creation funnel is measured from the moment the page loads until the address is connected.
    // Runs once on mount. On a fresh load it starts the funnel timer. When the page is loaded again after Google
    // redirected back, it resumes the timer saved in the OAuth state, since the funnel began before the redirect.
    useEffect(() => {
        if (callback.type === 'none') {
            trackBYOECreationStarted({ source: EASY_SWITCH_SOURCES.ACCOUNT_LITE_BYOE, isConversion: false });
        } else {
            // Coming back from Google is the same creation, which started before the redirect: restore its timer
            resumeBYOECreation(
                callback.type === 'code' ? callback.state.creationStartedAt : callback.state?.creationStartedAt
            );
        }
    }, []);

    // Telemetry: the settings page was opened. Every opening counts, so it runs once per mount, when the user and
    // the gating data are known. When the native app auto-starts the flow, the page is never shown, and when Google
    // redirected back the page only shows the loader, so neither counts as an opening.
    useEffect(() => {
        if (hasTrackedViewRef.current || isLoadingGating || telemetry.isLoading) {
            return;
        }
        hasTrackedViewRef.current = true;
        if (callback.type !== 'none' || autoParams.autoConnect) {
            return;
        }

        // Exactly one of the two events is sent, like the native clients.
        // Connecting turned off: the page only lists the connections.
        if (gatingOutcome === 'feature-disabled') {
            telemetry.trackSettingsListOnlyShown();
        } else {
            telemetry.trackSettingsView();
        }
    }, [isLoadingGating, telemetry.isLoading]);

    // Finishes the OAuth round trip: Google redirects back to this page with either a code or an error.
    // Not run on mount, because creating the address needs the user's addresses and feature status, so it waits
    // for the gating data to load.
    useEffect(() => {
        if (callback.type === 'none' || isLoadingGating || hasHandledCallbackRef.current) {
            return;
        }

        hasHandledCallbackRef.current = true;
        void handleOAuthCallback(callback);
    }, [callback, isLoadingGating]);

    // Starts the OAuth flow without a click on the connect button when the native app opened the page with
    // `autoconnect=1`: the user already made the choice (import emails or not) in the app.
    // Waits for the gating data to load so the checks run on real data. In case of an error, the user can see the
    // buttons as we revert to the idle state.
    useEffect(() => {
        if (status !== 'auto-starting' || isLoadingGating || hasAutoStartedRef.current) {
            return;
        }

        hasAutoStartedRef.current = true;
        if (canStartOAuthFlow()) {
            startOAuthFlowNow(autoParams.importEmails);
        } else {
            setStatus('idle');
        }
    }, [status, isLoadingGating]);

    const startOAuthFlowIfAllowed = (importEmails: boolean) => {
        if (canStartOAuthFlow()) {
            startOAuthFlowNow(importEmails);
        }
    };

    const reconnectAddress = async (address: Address) => {
        if (canStartOAuthFlow()) {
            const outcome = await reconnectWithExistingPermission(address);
            if (outcome === 'permission-required') {
                startReconnectOAuthFlow(address);
            }
        }
    };

    const retry = () => {
        dismissError();
        startOAuthFlowIfAllowed(getLastImportEmails());
    };

    return (
        <BYOEMobileContext.Provider
            value={{
                status,
                canStartOAuthFlow,
                reconnectAddress,
                connectingEmail,
                error,
                dismissError,
                retry,
                claimAddress,
                startOAuthFlowIfAllowed,
                isLoading,
                limitReached,
                defaultImportEmails: autoParams.importEmails,
            }}
        >
            {children}
        </BYOEMobileContext.Provider>
    );
};
