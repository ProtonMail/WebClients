import { useRef, useState } from 'react';

import { c } from 'ttag';

import type {
    ConnectBYOEAddressFailure,
    ConnectBYOEAddressResult,
} from '@proton/activation/src/byoe/connectBYOEAddress.interface';
import { useConnectBYOEAddress } from '@proton/activation/src/byoe/useConnectBYOEAddress';
import type { OAuthCallbackResult, OAuthRedirectState } from '@proton/activation/src/byoe/useOAuthRedirectFlow.helpers';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { trackBYOECreationError } from '@proton/activation/src/telemetry/byoeCreationFunnel';
import { useNotifications } from '@proton/app-context/useNotifications';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { getNativeSuccessUrl } from '../redirectToNative';
import type { BYOEMobileStatus } from './interface';

export type ClaimableFailure = Extract<ConnectBYOEAddressFailure, { type: 'claimable-address' }>;

interface Props {
    redirectUri: string;
    /** Used by retry when the OAuth state is missing. */
    defaultImportEmails: boolean;
    setStatus: (status: BYOEMobileStatus) => void;
}

/**
 * Turns what Google sends back into a connected address, and keeps the failure to show when it does not work out.
 * Does not know about the screen: the caller decides how the status and the failure are presented.
 */
export const useBYOEMobileConnection = ({ redirectUri, defaultImportEmails, setStatus }: Props) => {
    const { createNotification } = useNotifications();
    const { connectBYOEAddressWithCode, claimBYOEAddress } = useConnectBYOEAddress({
        source: EASY_SWITCH_SOURCES.ACCOUNT_LITE_BYOE,
    });

    // State stored before leaving for Google, kept for the retry and the claim, which happen after the round trip
    const oauthStateRef = useRef<OAuthRedirectState | undefined>(undefined);

    const [connectingEmail, setConnectingEmail] = useState<string | undefined>();
    const [error, setError] = useState<ConnectBYOEAddressFailure | null>(null);

    /** Returns true when the user is being handed back to the native app. */
    const handleResult = (result: ConnectBYOEAddressResult): boolean => {
        if (result.status === 'failure') {
            setError(result.reason);
            return false;
        }

        // The stored redirect comes back from session storage, so it is validated again
        const nativeUrl = getNativeSuccessUrl(oauthStateRef.current?.redirect, result.address.Email);
        if (nativeUrl) {
            replaceUrl(nativeUrl);
            return true;
        }
        createNotification({ text: c('Info').t`Your address was connected` });
        return false;
    };

    /** Runs a connection step behind the loader, whatever way it ends. */
    const runConnection = async (run: () => Promise<ConnectBYOEAddressResult>, email?: string) => {
        setConnectingEmail(email);
        setStatus('connecting');
        setError(null);
        // The status is reset in `finally` so a failure or a thrown error never leaves the screen stuck on the loader.
        // The exception is a redirect to the native app: the in-app browser takes a moment to close, and resetting
        // the status would flash the idle screen and let the user start the flow a second time.
        let isRedirectingToNative = false;
        try {
            isRedirectingToNative = handleResult(await run());
        } catch {
            // Anything thrown outside the hook's own failure results must not leave the user without feedback
            setError({ type: 'unknown' });
        } finally {
            if (!isRedirectingToNative) {
                setStatus('idle');
            }
        }
    };

    /** Finishes the OAuth round trip: Google redirected back with either a code or an error. */
    const handleOAuthCallback = async (callback: Exclude<OAuthCallbackResult, { type: 'none' }>) => {
        oauthStateRef.current = callback.state;

        if (callback.type === 'error') {
            trackBYOECreationError('authentication');
            setError({ type: 'token-failed' });
            return;
        }

        await runConnection(() =>
            connectBYOEAddressWithCode({
                code: callback.code,
                redirectUri,
                importEmails: callback.state.importEmails,
                onAccountResolved: setConnectingEmail,
            })
        );
    };

    /** Connects an address used on another account, once the user confirmed it. */
    const claimAddress = async ({ email, importEmails, importPeriod }: ClaimableFailure) => {
        await runConnection(() => claimBYOEAddress({ email, importEmails, importPeriod }), email);
    };

    return {
        connectingEmail,
        error,
        dismissError: () => setError(null),
        /** The "import emails" choice of the last attempt, to repeat it on retry. */
        getLastImportEmails: () => oauthStateRef.current?.importEmails ?? defaultImportEmails,
        handleOAuthCallback,
        claimAddress,
    };
};
