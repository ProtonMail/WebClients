import { c, msgid } from 'ttag';

import { PASS_PLUS_VAULTS } from '@proton/components/containers/payments/features/pass';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcBrandProtonMail } from '@proton/icons/icons/IcBrandProtonMail';
import { IcBrandProtonPass } from '@proton/icons/icons/IcBrandProtonPass';
import { IcBrandProtonVpn } from '@proton/icons/icons/IcBrandProtonVpn';
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
            <FeatureItem
                icon={<IcBrandProtonDrive size={5} />}
                loading={!maxSpace}
                text={getSecureStorageString(maxSpace)}
                highlighted
            />
            <FeatureItem
                icon={<IcBrandProtonMail size={5} />}
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
            <FeatureItem
                icon={<IcBrandProtonVpn size={5} />}
                text={c('Signup').ngettext(
                    msgid`${VPN_CONNECTIONS} high-speed VPN connection`,
                    `${VPN_CONNECTIONS} high-speed VPN connections`,
                    VPN_CONNECTIONS
                )}
                highlighted
            />
            <FeatureItem
                icon={<IcBrandProtonPass size={5} />}
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
