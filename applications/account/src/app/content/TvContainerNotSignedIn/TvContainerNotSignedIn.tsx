import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { useApi } from '@proton/components/index';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { TelemetryMeasurementGroups, TelemetryVpnTvEvents } from '@proton/shared/lib/api/telemetry';
import { isAndroid } from '@proton/shared/lib/helpers/browser';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { setItem } from '@proton/shared/lib/helpers/storage';
import { useFlag } from '@proton/unleash/useFlag';
import { TvNotSignedIn } from '@proton/vpn/components/tv';
import { VPN_TV_USER_TIER } from '@proton/vpn/constants/tvUserTier.ts';

import Layout from '../../public/Layout';
import Main from '../../public/Main';
import SupportDropdown from '../../public/SupportDropdown';
import type { Paths } from '../helper';

export const TvContainerNotSignedIn = ({ searchParams, paths }: { searchParams: URLSearchParams; paths: Paths }) => {
    const api = useApi();
    const unauthedForgotPasswordEnabled = useFlag('UnauthedForgotPassword');

    useEffectOnce(() => {
        void sendTelemetryReport({
            api,
            delay: false,
            event: TelemetryVpnTvEvents.tvAuthInitiated,
            dimensions: { userTierAtInitiation: 'non_user', flowType: 'web' },
            measurementGroup: TelemetryMeasurementGroups.vpnTv,
        });

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
                        to={`${paths.reset}?variant=${!unauthedForgotPasswordEnabled ? 'a' : 'b'}`}
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
