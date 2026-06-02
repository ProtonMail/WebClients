import { c, msgid } from 'ttag';

import { FREE_PASS_ALIASES } from '@proton/components/containers/payments/features/pass';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { VPN_SERVERS } from '@proton/vpn/constants/vpnServers';

import FeatureItem from '../FeatureItem/FeatureItem';

export const FreeFeatures = () => {
    const payments = usePaymentOptimistic();
    const freePlan = payments.freePlan;

    const totalMailStorageSize = humanSize({ bytes: freePlan.MaxBaseRewardSpace, fraction: 0 });
    const totalDriveStorageSize = humanSize({ bytes: freePlan.MaxDriveRewardSpace, fraction: 0 });
    const maxAddresses = freePlan.MaxAddresses || 1;
    const maxCalendars = freePlan.MaxCalendars || MAX_CALENDARS_FREE;

    return (
        <>
            <FeatureItem text={c('Signup').t`Encrypted email with ${totalMailStorageSize} storage`} highlighted />
            <FeatureItem
                text={[
                    c('Signup').ngettext(msgid`${maxAddresses} address`, `${maxAddresses} addresses`, maxAddresses),
                    c('Signup').ngettext(msgid`${maxCalendars} calendar`, `${maxCalendars} calendars`, maxCalendars),
                ].join(', ')}
                highlighted
            />
            <FeatureItem
                text={c('Signup').ngettext(
                    msgid`VPN with servers in ${VPN_SERVERS.free.countries} country`,
                    `VPN with servers in ${VPN_SERVERS.free.countries} countries`,
                    VPN_SERVERS.free.countries
                )}
                highlighted
            />
            <FeatureItem
                text={c('Signup').t`${totalDriveStorageSize} cloud storage for files and photos`}
                highlighted
            />
            <FeatureItem text={c('Signup').t`Collaborative document editing`} highlighted />
            <FeatureItem text={c('Signup').t`Password manager for all your devices`} highlighted />
            <FeatureItem
                text={c('Signup').ngettext(
                    msgid`${FREE_PASS_ALIASES} hide-my-email alias to fight spam`,
                    `${FREE_PASS_ALIASES} hide-my-email aliases to fight spam`,
                    FREE_PASS_ALIASES
                )}
                highlighted
            />
        </>
    );
};
