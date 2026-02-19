import { c, msgid } from 'ttag';

import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcShield } from '@proton/icons/icons/IcShield';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { VPN_CONNECTIONS } from '@proton/shared/lib/constants';

import FeatureItem from '../FeatureItem/FeatureItem';

export const VPNFeatures = () => {
    const payments = usePaymentOptimistic();
    const vpnServersCountData = payments.vpnServersCountData;
    const vpnServersCountLoading = !payments.initializationStatus.vpnServersInitialized;

    return (
        <>
            <FeatureItem
                icon={<IcGlobe size={5} />}
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
            <FeatureItem
                icon={<IcShield size={5} />}
                text={c('Signup').t`Block ads, trackers, and malware`}
                highlighted
            />
            <FeatureItem
                icon={<IcMobile size={5} />}
                text={c('Signup').ngettext(
                    msgid`Secure ${VPN_CONNECTIONS} device at a time`,
                    `Secure ${VPN_CONNECTIONS} devices at a time`,
                    VPN_CONNECTIONS
                )}
                highlighted
            />
        </>
    );
};
