import { Link } from 'react-router-dom';

import { c } from 'ttag';

import useEffectOnce from '@proton/hooks/useEffectOnce';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { isAndroid } from '@proton/shared/lib/helpers/browser';
import { setItem } from '@proton/shared/lib/helpers/storage';
import { telemetry } from '@proton/shared/lib/telemetry';
import { useFlag } from '@proton/unleash/useFlag';
import { TvNotSignedIn } from '@proton/vpn/components/tv';
import { VPN_TV_USER_TIER } from '@proton/vpn/constants/tvUserTier.ts';

import Layout from '../../public/Layout';
import Main from '../../public/Main';
import SupportDropdown from '../../public/SupportDropdown';
import type { Paths } from '../helper';

export const TvContainerNotSignedIn = ({ searchParams, paths }: { searchParams: URLSearchParams; paths: Paths }) => {
    const unauthedForgotPasswordEnabled = useFlag('UnauthedForgotPassword');

    useEffectOnce(() => {
        telemetry.sendCustomEvent('tv_auth_initiated', { userTierAtInitiation: 'non_user', flowType: 'web' });
        setItem(VPN_TV_USER_TIER, 'non_user');

        const code = searchParams.get('code');
        if (isAndroid() && code) {
            window.location.href = `protonvpn://session-fork/${code}`;
        }
    });

    return (
        <Layout toApp="proton-vpn-settings" hasDecoration hasAppLogos={false} hasFooter={false}>
            <Main className="flex flex-column gap-4 p-4 w-auto" style={{ 'justify-self': 'center' }}>
                <TvNotSignedIn searchParams={searchParams} paths={paths} />
                <SupportDropdown buttonClassName="mx-auto link link-focus" content={c('Link').t`Trouble signing in?`}>
                    <Link
                        to={`${paths.reset}?variant=${unauthedForgotPasswordEnabled ? 'b' : 'a'}`}
                        className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                    >
                        <IcKey />
                        {c('Link').t`Forgot password?`}
                    </Link>
                    <Link
                        to={paths.forgotUsername}
                        className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                    >
                        <IcUserCircle />
                        {c('Link').t`Forgot username?`}
                    </Link>
                </SupportDropdown>
            </Main>
        </Layout>
    );
};
