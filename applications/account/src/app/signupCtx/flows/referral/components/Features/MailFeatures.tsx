import { c, msgid } from 'ttag';

import { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { DARK_WEB_MONITORING_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { getMaxSpaceMap } from '../../helpers/getMaxSpaceMap';
import { getSecureStorageString } from '../../helpers/i18n';
import FeatureItem from '../FeatureItem/FeatureItem';

export const MailFeatures = () => {
    const payments = usePaymentOptimistic();
    const maxSpace = getMaxSpaceMap(payments)[PLANS.MAIL];

    const plan = payments.plansMap[PLANS.MAIL];
    const maxAddresses = plan?.MaxAddresses || 10;

    return (
        <>
            <FeatureItem loading={!maxSpace} text={getSecureStorageString(maxSpace)} highlighted />
            <FeatureItem
                loading={payments.loadingPaymentDetails}
                text={c('Signup').ngettext(
                    msgid`${maxAddresses} extra email address`,
                    `${maxAddresses} extra email addresses`,
                    maxAddresses
                )}
                highlighted
            />
            <FeatureItem text={c('Signup').t`Use your own email domain`} highlighted />
            <FeatureItem text={c('Signup').t`Unlimited folders, labels, and filters`} highlighted />
            <FeatureItem text={c('Signup').t`${MAIL_APP_NAME} desktop app`} highlighted />
            <FeatureItem text={DARK_WEB_MONITORING_NAME} highlighted />
        </>
    );
};
