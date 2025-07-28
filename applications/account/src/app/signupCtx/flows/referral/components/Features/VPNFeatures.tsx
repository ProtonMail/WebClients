import { c, msgid } from 'ttag';

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
            <FeatureItem
                text={c('Signup').ngettext(
                    msgid`Secure ${VPN_CONNECTIONS} device at a time`,
                    `Secure ${VPN_CONNECTIONS} devices at a time`,
                    VPN_CONNECTIONS
                )}
                highlighted
            />
            <FeatureItem text={c('Signup').t`Highest VPN speed`} highlighted />
            <FeatureItem
                loading={vpnServersCountLoading}
                text={[
                    // Translator: Full sentence: "N+ servers across N+ countries"
                    c('Signup').ngettext(
                        msgid`${vpnServersCountData.paid.servers}+ server across`,
                        `${vpnServersCountData.paid.servers}+ servers across`,
                        vpnServersCountData.paid.servers
                    ),
                    c('Signup').ngettext(
                        msgid`${vpnServersCountData.paid.countries}+ country`,
                        `${vpnServersCountData.paid.countries}+ countries`,
                        vpnServersCountData.paid.countries
                    ),
                ].join(', ')}
                highlighted
            />
            <FeatureItem text={c('Signup').t`Fast P2P/BitTorrent downloads`} highlighted />
        </>
    );
};
