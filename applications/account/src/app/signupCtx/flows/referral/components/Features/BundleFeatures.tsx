import { c, msgid } from 'ttag';

import { PASS_PLUS_VAULTS } from '@proton/components/containers/payments/features/pass';
import { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { VPN_CONNECTIONS } from '@proton/shared/lib/constants';

import { getMaxSpaceMap } from '../../helpers/getMaxSpaceMap';
import { getSecureStorageString } from '../../helpers/i18n';
import FeatureItem from '../FeatureItem/FeatureItem';

export const BundleFeatures = () => {
    const payments = usePaymentOptimistic();
    const bundlePlan = payments.plansMap[PLANS.BUNDLE];
    const maxSpace = getMaxSpaceMap(payments)[PLANS.BUNDLE];
    const maxAddresses = bundlePlan?.MaxAddresses || 10;
    const maxDomains = bundlePlan?.MaxDomains || 3;

    return (
        <>
            <FeatureItem loading={!maxSpace} text={getSecureStorageString(maxSpace)} highlighted />
            <FeatureItem
                text={[
                    c('Signup').ngettext(
                        msgid`${maxAddresses} email address`,
                        `${maxAddresses} email addresses`,
                        maxAddresses
                    ),
                    c('Signup').ngettext(msgid`${maxDomains} email domain`, `${maxDomains} email domains`, maxDomains),
                ].join(', ')}
                highlighted
            />
            <FeatureItem text={c('Signup').t`Unlimited hide-my-email aliases`} highlighted />
            <FeatureItem text={c('Signup').t`Encrypted file sharing and document editor`} highlighted />
            <FeatureItem
                text={c('Signup').ngettext(
                    msgid`${VPN_CONNECTIONS} high-speed VPN connection`,
                    `${VPN_CONNECTIONS} high-speed VPN connections`,
                    VPN_CONNECTIONS
                )}
                highlighted
            />
            <FeatureItem
                text={c('Signup').ngettext(
                    msgid`${PASS_PLUS_VAULTS} vault for your passwords`,
                    `${PASS_PLUS_VAULTS} vaults for your passwords`,
                    PASS_PLUS_VAULTS
                )}
                highlighted
            />
        </>
    );
};
