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
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Toggle from '@proton/components/components/toggle/Toggle';
import useToggle from '@proton/hooks/useToggle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import icon from '@proton/styles/assets/img/byoe/mobile-gmail-app-icon.svg';

import MobileSection from '../../components/MobileSection';
import MobileSectionLabel from '../../components/MobileSectionLabel';
import MobileSectionRow from '../../components/MobileSectionRow';
import { SupportedActions } from '../../helper';

import '../MobileSettings.scss';

interface Props {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    /** Native app URL to hand control back to once the address is connected. */
    redirect: string | undefined;
}

// Google sends the user back here after consent. This exact URL must be allowlisted on the Google OAuth client.
const REDIRECT_PATH = `/lite?action=${SupportedActions.BYOEMobile}`;

const BYOEMobileContent = ({ redirect }: Omit<Props, 'layout'>) => {
    const hasHandledCallbackRef = useRef(false);

    const { state, toggle } = useToggle(true);
    const { createNotification } = useNotifications();

    const { checkGating, isLoadingGating } = useBYOEGating();
    const { connectBYOEAddressWithCode } = useConnectBYOEAddress({ source: EASY_SWITCH_SOURCES.ACCOUNT_LITE_BYOE });
    const { startOAuthFlow, callback, redirectUri } = useOAuthRedirectFlow({
        features: [EASY_SWITCH_FEATURES.BYOE],
        redirectPath: REDIRECT_PATH,
    });

    // Already loading when coming back from the provider, so the button never looks idle while we wait for gating
    const [loading, setLoading] = useState(callback.type === 'code');

    const handleCallbackCode = async ({ code, state }: Extract<OAuthCallbackResult, { type: 'code' }>) => {
        setLoading(true);
        try {
            const result = await connectBYOEAddressWithCode({
                code,
                redirectUri,
                importEmails: state.importEmails,
            });

            if (result.status === 'success') {
                // DAWG-66 redirect to native here
                createNotification({ text: c('Info').t`Your address was connected` });
                return;
            }

            if (result.reason.type === 'already-added') {
                createNotification({ text: c('Info').t`This address is already linked to another account` });
            }
        } finally {
            setLoading(false);
        }
    };

    // Google sent the user back: handle the callback once, as soon as the data it depends on is loaded
    useEffect(() => {
        // The address setup reads the user's addresses and feature status, so they must be loaded first
        if (callback.type === 'none' || isLoadingGating || hasHandledCallbackRef.current) {
            return;
        }

        hasHandledCallbackRef.current = true;
        if (callback.type === 'error') {
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
    const handleConnect = () => {
        const outcome = checkGating();
        if (outcome === 'feature-disabled' || outcome === 'no-access') {
            createNotification(getBYOEDisabledNotification());
        } else if (outcome === 'free-limit' || outcome === 'paid-limit') {
            createNotification(getGenericLimitReached());
        } else if (outcome === 'ok') {
            // The page navigates away, the loading state is intentionally never reset
            setLoading(true);
            startOAuthFlow({ importEmails: state, redirect });
        }
    };

    return (
        <div className="mobile-settings">
            <MobileSection>
                <MobileSectionRow stackContent>
                    <img src={icon} alt="" height={68} width={74} className="mb-4" />
                    <h2 className="text-3xl text-bold m-0 mb-2">{c('Title').t`Connected addresses`}</h2>
                    <p className="color-weak m-0 mb-3">{c('Description')
                        .t`Make your Gmail private in under a minute, without editing or deleting anything there.`}</p>
                    <div className="color-weak">
                        <p className="text-semibold m-0 mb-2">{c('Label').t`You will be able to:`}</p>
                        <ul className="m-0 mb-2 pl-5">
                            <li className="text-medium">{c('Label')
                                .t`Receive Gmail straight in ${BRAND_NAME} inbox`}</li>
                            <li className="text-medium">{c('Label')
                                .t`Send from your Gmail address in ${BRAND_NAME}`}</li>
                        </ul>
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="import-toggle"
                        description={<span>{c('Label').t`Start with your most recent messages`}</span>}
                    >
                        {c('Label').t`Import messages`}
                    </MobileSectionLabel>
                    <Toggle id="import-toggle" checked={state} onChange={toggle} disabled={loading} />
                </MobileSectionRow>
                <MobileSectionRow>
                    <Button
                        fullWidth
                        size="large"
                        color="norm"
                        shape="solid"
                        className="rounded-full"
                        onClick={handleConnect}
                        loading={loading}
                        disabled={isLoadingGating || loading}
                    >{c('Action').t`Connect and import`}</Button>
                </MobileSectionRow>
            </MobileSection>
        </div>
    );
};

export const BYOEMobile = ({ layout, redirect }: Props) => {
    return layout(
        <EasySwitchStoreProvider>
            <EasySwitchStoreInitializer>
                <BYOEMobileContent redirect={redirect} />
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>,
        { className: 'overflow-auto' }
    );
};
