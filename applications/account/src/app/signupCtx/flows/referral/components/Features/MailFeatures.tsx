import { c, msgid } from 'ttag';

import { FREE_PASS_ALIASES } from '@proton/components/containers/payments/features/pass';
import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcAt } from '@proton/icons/icons/IcAt';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';

import FeatureItem from '../FeatureItem/FeatureItem';

export const MailFeatures = () => {
    const payments = usePaymentOptimistic();

    const plan = payments.plansMap[PLANS.MAIL];
    const maxAddresses = plan?.MaxAddresses || 10;

    return (
        <>
            <FeatureItem
                icon={<IcEnvelope size={5} />}
                loading={payments.loadingPaymentDetails}
                text={c('Signup').ngettext(
                    msgid`${maxAddresses} extra email address for you`,
                    `${maxAddresses} extra email addresses for you`,
                    maxAddresses
                )}
                highlighted
            />
            <FeatureItem
                icon={<IcAlias size={5} />}
                loading={payments.loadingPaymentDetails}
                text={c('Signup').ngettext(
                    msgid`${FREE_PASS_ALIASES} hide-my-email alias`,
                    `${FREE_PASS_ALIASES} hide-my-email aliases`,
                    FREE_PASS_ALIASES
                )}
                highlighted
            />
            <FeatureItem icon={<IcAt size={5} />} text={c('Signup').t`Custom email domain`} highlighted />
        </>
    );
};
