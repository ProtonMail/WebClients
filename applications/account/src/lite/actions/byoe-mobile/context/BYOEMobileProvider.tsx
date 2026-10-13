import { type PropsWithChildren, createContext, useContext, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useBYOEGating } from '@proton/activation/src/byoe/useBYOEGating';
import { useConnectBYOEAddress } from '@proton/activation/src/byoe/useConnectBYOEAddress';
import { useOAuthRedirectFlow } from '@proton/activation/src/byoe/useOAuthRedirectFlow';
import type { OAuthCallbackResult } from '@proton/activation/src/byoe/useOAuthRedirectFlow.helpers';
import { getBYOEDisabledNotification, getGenericLimitReached } from '@proton/activation/src/constants';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import {
    getBYOECreationStartedAt,
    resumeBYOECreation,
    trackBYOECreationError,
    trackBYOECreationStarted,
    trackBYOEGoogleSignInClicked,
} from '@proton/activation/src/telemetry/byoeCreationFunnel';
import { useNotifications } from '@proton/app-context/useNotifications';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { getNativeSuccessUrl } from '../redirectToNative';
import { type BYOEMobileStatus, REDIRECT_PATH } from './interface';

interface BYOEMobileContextValue {
    status: BYOEMobileStatus;
    isLoading: boolean;
    defaultImportEmails: boolean;
    connectingEmail: string | undefined;
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
    const { UID } = useAuthentication();
    const { createNotification } = useNotifications();

    const { isLoadingGating, checkGating } = useBYOEGating();

    const { connectBYOEAddressWithCode } = useConnectBYOEAddress({ source: EASY_SWITCH_SOURCES.ACCOUNT_LITE_BYOE });
    const { callback, redirectUri, startOAuthFlow } = useOAuthRedirectFlow({
        features: [EASY_SWITCH_FEATURES.BYOE],
        redirectPath: REDIRECT_PATH,
    });

    const hasAutoStartedRef = useRef(false);
    const hasHandledCallbackRef = useRef(false);

    // Read once: `initialSearchParams` is a snapshot of the first load and never changes
    const [autoParams] = useState(() => getAutoConnectParams(initialSearchParams));
    const [connectingEmail, setConnectingEmail] = useState<string | undefined>();
    const [status, setStatus] = useState<BYOEMobileStatus>(() => {
        if (callback.type === 'code') {
            return 'connecting';
        }
        return autoParams.autoConnect && callback.type === 'none' ? 'auto-starting' : 'idle';
    });

    const isStartingOAuth = status === 'starting-oauth';
    const isLoading = isStartingOAuth || isLoadingGating;

    const handleCallbackCode = async ({ code, state }: Extract<OAuthCallbackResult, { type: 'code' }>) => {
        setStatus('connecting');
        // The status is reset in `finally` so a failure or a thrown error never leaves the screen stuck on the loader.
        // The exception is a redirect to the native app: the in-app browser takes a moment to close, and resetting
        // the status would flash the idle screen and let the user start the flow a second time.
        let isRedirectingToNative = false;
        try {
            const result = await connectBYOEAddressWithCode({
                code,
                redirectUri,
                importEmails: state.importEmails,
                onAccountResolved: setConnectingEmail,
            });

            if (result.status === 'success') {
                // The stored redirect comes back from session storage, so it is validated again
                const nativeUrl = getNativeSuccessUrl(state.redirect, result.address.Email);
                if (nativeUrl) {
                    isRedirectingToNative = true;
                    replaceUrl(nativeUrl);
                    return;
                }
                createNotification({ text: c('Info').t`Your address was connected` });
                return;
            }

            if (result.reason.type === 'already-added') {
                createNotification({ text: c('Info').t`This address is already linked to another account` });
            }
        } finally {
            if (!isRedirectingToNative) {
                setStatus('idle');
            }
        }
    };

    const startOAuthFlowNow = (importEmails: boolean) => {
        // The page navigates away right after, so the telemetry event must be sent before starting the flow.
        trackBYOEGoogleSignInClicked({ hasImportEmails: importEmails, importPeriod: undefined });
        // The page navigates away, so the auto-starting status is intentionally never reset.
        setStatus(status === 'auto-starting' ? 'auto-starting' : 'starting-oauth');
        startOAuthFlow({ importEmails, redirect, sessionUID: UID, creationStartedAt: getBYOECreationStartedAt() });
    };

    const canStartOAuthFlow = (): boolean => {
        const outcome = checkGating();
        if (outcome === 'ok') {
            return true;
        }

        if (outcome === 'feature-disabled' || outcome === 'no-access') {
            createNotification(getBYOEDisabledNotification());
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

    // Finishes the OAuth round trip: Google redirects back to this page with either a code or an error.
    // Not run on mount, because creating the address needs the user's addresses and feature status, so it waits
    // for the gating data to load.
    useEffect(() => {
        if (callback.type === 'none' || isLoadingGating || hasHandledCallbackRef.current) {
            return;
        }

        hasHandledCallbackRef.current = true;
        if (callback.type === 'error') {
            trackBYOECreationError('authentication');
            createNotification({
                type: 'error',
                // translators: This string is shown when something went wrong during easy switch Gmail oAuth
                text: c('Error').t`Permissions request failed.`,
            });
            return;
        }

        void handleCallbackCode(callback);
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

    return (
        <BYOEMobileContext.Provider
            value={{
                status,
                connectingEmail,
                startOAuthFlowIfAllowed,
                isLoading,
                defaultImportEmails: autoParams.importEmails,
            }}
        >
            {children}
        </BYOEMobileContext.Provider>
    );
};
