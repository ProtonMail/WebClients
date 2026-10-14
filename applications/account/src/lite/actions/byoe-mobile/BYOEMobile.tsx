import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useBYOEGating } from '@proton/activation/src/byoe/useBYOEGating';
import { useConnectBYOEAddress } from '@proton/activation/src/byoe/useConnectBYOEAddress';
import { useOAuthRedirectFlow } from '@proton/activation/src/byoe/useOAuthRedirectFlow';
import type { OAuthCallbackResult } from '@proton/activation/src/byoe/useOAuthRedirectFlow.helpers';
import { getBYOEDisabledNotification, getGenericLimitReached } from '@proton/activation/src/constants';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import EasySwitchStoreProvider from '@proton/activation/src/logic/StoreProvider';
import {
    getBYOECreationStartedAt,
    resumeBYOECreation,
    trackBYOECreationError,
    trackBYOECreationStarted,
    trackBYOEGoogleSignInClicked,
} from '@proton/activation/src/telemetry/byoeCreationFunnel';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Toggle from '@proton/components/components/toggle/Toggle';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useToggle from '@proton/hooks/useToggle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import icon from '@proton/styles/assets/img/byoe/mobile-gmail-app-icon.svg';

import MobileSection from '../../components/MobileSection';
import MobileSectionLabel from '../../components/MobileSectionLabel';
import MobileSectionRow from '../../components/MobileSectionRow';
import { SupportedActions } from '../../helper';
import { BYOEMobileConnecting } from './BYOEMobileConnecting';
import { getNativeSuccessUrl } from './redirectToNative';

import '../MobileSettings.scss';

interface Props {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    /** Native app URL to hand control back to once the address is connected. */
    redirect: string | undefined;
    /** Search params from the first load: the URL is rewritten by the login flow before this component mounts. */
    initialSearchParams: URLSearchParams;
}

// Google sends the user back here after consent. This exact URL must be allowlisted on the Google OAuth client.
const REDIRECT_PATH = `/lite?action=${SupportedActions.BYOEMobile}`;

// - `idle`: the form is shown.
// - `auto-starting`: the native app asked to skip the form, waiting to open the OAuth flow. Falls back to `idle` if gating refuses.
// - `starting-oauth`: the user pressed connect and the page is about to navigate to the provider.
// - `connecting`: back from the provider, the address is being created.
type BYOEMobileStatus = 'idle' | 'auto-starting' | 'starting-oauth' | 'connecting';

// Native app deep link has two params:
// - `autoconnect=1` skips this screen and opens the OAuth flow right away.
// - `importEmails=0` turns off the email import (on by default).
const getAutoConnectParams = (params: URLSearchParams) => {
    return {
        autoConnect: params.get('autoconnect') === '1',
        importEmails: params.get('importEmails') !== '0',
    };
};

const BYOEMobileContent = ({ redirect, initialSearchParams }: Omit<Props, 'layout'>) => {
    const hasAutoStartedRef = useRef(false);
    const hasHandledCallbackRef = useRef(false);
    const [autoParams] = useState(() => getAutoConnectParams(initialSearchParams));

    const { state: importEmails, toggle } = useToggle(autoParams.importEmails);
    const { createNotification } = useNotifications();
    const { UID, localID } = useAuthentication();

    const { checkGating, isLoadingGating } = useBYOEGating();
    const { connectBYOEAddressWithCode } = useConnectBYOEAddress({ source: EASY_SWITCH_SOURCES.ACCOUNT_LITE_BYOE });
    const { startOAuthFlow, callback, redirectUri } = useOAuthRedirectFlow({
        features: [EASY_SWITCH_FEATURES.BYOE],
        redirectPath: REDIRECT_PATH,
    });

    // A single status so the screen can only be in one state at a time.
    const [status, setStatus] = useState<BYOEMobileStatus>(() => {
        if (callback.type === 'code') {
            return 'connecting';
        }
        return autoParams.autoConnect && callback.type === 'none' ? 'auto-starting' : 'idle';
    });
    const [connectingEmail, setConnectingEmail] = useState<string | undefined>();

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

    // Google sent the user back: handle the callback once, as soon as the data it depends on is loaded
    useEffect(() => {
        // The address setup reads the user's addresses and feature status, so they must be loaded first
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

    // Make sure the user can create a BYOE address, and open the OAuth flow to connect it
    const handleConnect = (): boolean => {
        const outcome = checkGating();
        if (outcome === 'feature-disabled' || outcome === 'no-access') {
            createNotification(getBYOEDisabledNotification());
        } else if (outcome === 'free-limit' || outcome === 'paid-limit') {
            createNotification(getGenericLimitReached());
        } else if (outcome === 'ok') {
            // The page navigates away right after: send the report now. There is no period selector on mobile
            trackBYOEGoogleSignInClicked({ hasImportEmails: importEmails, importPeriod: undefined });
            // The page navigates away, the status is intentionally never reset.
            // An automatic start keeps its loader instead of flashing the form.
            setStatus(status === 'auto-starting' ? 'auto-starting' : 'starting-oauth');
            // The session is saved with the OAuth state so the lite app can resume it, with its key password, when the
            // provider sends the user back
            startOAuthFlow({
                importEmails,
                redirect,
                sessionUID: UID,
                sessionLocalID: localID,
                creationStartedAt: getBYOECreationStartedAt(),
            });
            return true;
        }
        return false;
    };

    // Native app already collected the choice: start the OAuth flow without any user input
    useEffect(() => {
        if (status !== 'auto-starting' || isLoadingGating || hasAutoStartedRef.current) {
            return;
        }

        hasAutoStartedRef.current = true;
        const started = handleConnect();
        if (!started) {
            setStatus('idle');
        }
    }, [status, isLoadingGating]);

    if (status === 'connecting') {
        return <BYOEMobileConnecting email={connectingEmail} />;
    }

    if (status === 'auto-starting') {
        return (
            <div className="mobile-settings flex items-center justify-center h-full">
                <CircleLoader size="large" />
            </div>
        );
    }

    const isStartingOAuth = status === 'starting-oauth';

    return (
        <div className="mobile-settings">
            <MobileSection>
                <MobileSectionRow stackContent>
                    <img src={icon} alt="" height={68} width={74} className="mb-4" />
                    <h2 className="text-3xl text-bold m-0 mb-2">{c('Title').t`Connected addresses`}</h2>
                    <p className="color-weak m-0 mb-3">{c('Description')
                        .t`No ads, no tracking. Use your Gmail in ${BRAND_NAME}. Nothing there gets edited or deleted.`}</p>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="import-toggle"
                        description={<span>{c('Label').t`Start with your most recent messages`}</span>}
                    >
                        {c('Label').t`Import your emails`}
                    </MobileSectionLabel>
                    <Toggle id="import-toggle" checked={importEmails} onChange={toggle} disabled={isStartingOAuth} />
                </MobileSectionRow>
                <MobileSectionRow>
                    <Button
                        fullWidth
                        size="large"
                        color="norm"
                        shape="solid"
                        className="rounded-full"
                        onClick={handleConnect}
                        loading={isStartingOAuth}
                        disabled={isLoadingGating || isStartingOAuth}
                    >
                        {importEmails ? c('Action').t`Connect and import` : c('Action').t`Connect`}
                    </Button>
                </MobileSectionRow>
            </MobileSection>
        </div>
    );
};

export const BYOEMobile = ({ layout, redirect, initialSearchParams }: Props) => {
    return layout(
        <EasySwitchStoreProvider>
            <EasySwitchStoreInitializer>
                <BYOEMobileContent redirect={redirect} initialSearchParams={initialSearchParams} />
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>,
        { className: 'overflow-auto' }
    );
};
