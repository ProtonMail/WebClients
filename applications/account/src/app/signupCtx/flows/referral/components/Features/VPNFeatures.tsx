import { c, msgid } from 'ttag';

import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcShield } from '@proton/icons/icons/IcShield';
import { VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { VPN_SERVERS } from '@proton/vpn/constants/vpnServers';

import FeatureItem from '../FeatureItem/FeatureItem';

export const VPNFeatures = () => {
    return (
        <>
            <FeatureItem
                icon={<IcGlobe size={5} />}
                text={[
                    // Translator: Full sentence: "N+ servers across N+ countries"
                    c('Signup').ngettext(
                        msgid`${VPN_SERVERS.paid.servers}+ server across`,
                        `${VPN_SERVERS.paid.servers}+ servers across`,
                        VPN_SERVERS.paid.servers
                    ),
                    c('Signup').ngettext(
                        msgid`${VPN_SERVERS.paid.countries}+ country`,
                        `${VPN_SERVERS.paid.countries}+ countries`,
                        VPN_SERVERS.paid.countries
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
