import { c } from 'ttag';

import { usePaymentOptimistic } from '@proton/payments/ui';
import { VPN_CONNECTIONS } from '@proton/shared/lib/constants';

import FeatureItem from '../FeatureItem/FeatureItem';

export const VPNFeatures = () => {
    const payments = usePaymentOptimistic();
    const vpnServersCountData = payments.vpnServersCountData;
    const vpnServersCountLoading = !payments.initializationStatus.vpnServersInitialized;

    return (
        <>
            <FeatureItem text={c('Signup').t`Stream your favorite TV shows and movies`} highlighted />
            <FeatureItem text={c('Signup').t`Block ads, trackers, and malware`} highlighted />
            <FeatureItem text={c('Signup').t`Secure ${VPN_CONNECTIONS} devices at a time`} highlighted />
            <FeatureItem text={c('Signup').t`Highest VPN speed`} highlighted />
            <FeatureItem
                loading={vpnServersCountLoading}
                text={c('Signup')
                    .t`${vpnServersCountData.paid.servers}+ servers across ${vpnServersCountData.paid.countries}+ countries`}
                highlighted
            />
            <FeatureItem text={c('Signup').t`Fast P2P/BitTorrent downloads`} highlighted />
        </>
    );
};
