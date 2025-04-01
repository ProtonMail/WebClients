import { type ComponentProps, type ReactElement, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import ButtonLike from '@proton/atoms/Button/ButtonLike';
import useApi from '@proton/components/hooks/useApi';
import { COUPON_CODES, PLANS } from '@proton/payments/core/constants';
import { queryScopes } from '@proton/shared/lib/api/auth';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getExploreText } from '@proton/shared/lib/apps/i18n';
import { APPS, BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import OAuthSetPasswordForm from './OAuthSetPasswordForm';
import SubscribeAccount from './SubscribeAccount';
import greenCheckmark from './green-checkmark.svg';

type SubscribeAccountProps = ComponentProps<typeof SubscribeAccount>;

const VPNLite = (props: SubscribeAccountProps) => {
    const [user] = useUser();
    const [shouldConvertAccount, setShouldConvertAccount] = useState(false);
    const [showConvertAccount, setShowConvertAccount] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const api = useApi();
    const [searchParams, setSearchParams] = useState(props.searchParams);

    useEffect(() => {
        const fetchScopes = async () => {
            try {
                const { Scopes } = await api<{ Scopes: string[] }>(queryScopes());
                return Scopes;
            } catch (e) {
                return [];
            }
        };

        const run = async () => {
            if (user.Subscribed) {
                setShowConvertAccount(true);
            } else {
                const overriddenSearchParams = new URLSearchParams(props.searchParams);

                // Override the search params with the Vivaldi coupon, and take the user directly to the checkout screen.
                // Only do this if the user isn't subscribed because the coupon presumably isn't valid once a subscription has been purchased.
                overriddenSearchParams.append('start', 'checkout');
                overriddenSearchParams.append('coupon', COUPON_CODES.VPN_VIVALDI);
                overriddenSearchParams.append('disablePlanSelector', 'true');
                overriddenSearchParams.append('plan', PLANS.VPN2024);

                setSearchParams(overriddenSearchParams);
            }

            const scopes = await fetchScopes();
            setShouldConvertAccount(scopes.includes('full'));
        };

        void run();
    }, []);

    let childOverride: ReactElement | undefined;

    if (showSuccess) {
        childOverride = (
            <>
                <div className="text-center mb-8">
                    <h1 className="text-bold text-4xl">{c('Info').t`You’re all set`}</h1>
                </div>
                <div className="m-auto mb-4 max-w-custom text-center" style={{ '--max-w-custom': '25rem' }}>
                    <div className="mb-4">
                        <img src={greenCheckmark} alt="" />
                    </div>
                    <div className="mb-4">{c('Info').t`Thank you for choosing ${BRAND_NAME}.`}</div>
                    <div className="mb-4">{c('Email').t`You can safely close this tab.`}</div>
                    <div className="mt-8">
                        <ButtonLike
                            color="norm"
                            target="_self"
                            as="a"
                            fullWidth
                            href={getAppHref(`/vpn/dashboard?email=${user.Email}`, APPS.PROTONACCOUNT)}
                        >
                            {getExploreText(VPN_APP_NAME)}
                        </ButtonLike>
                    </div>
                </div>
            </>
        );
    } else if (showConvertAccount && shouldConvertAccount) {
        childOverride = (
            <>
                <div className="text-center mb-8">
                    <h1 className="text-bold text-4xl">{c('Info').t`Set password`}</h1>
                </div>
                <div className="m-auto mb-4 max-w-custom" style={{ '--max-w-custom': '25rem' }}>
                    <OAuthSetPasswordForm
                        onSuccess={() => {
                            setShowSuccess(true);
                        }}
                    />
                </div>
            </>
        );
    }

    return (
        <SubscribeAccount
            {...props}
            searchParams={searchParams}
            childOverride={childOverride}
            onSubscribed={() => {
                if (shouldConvertAccount) {
                    setShowConvertAccount(true);
                }
            }}
        />
    );
};

export default VPNLite;
