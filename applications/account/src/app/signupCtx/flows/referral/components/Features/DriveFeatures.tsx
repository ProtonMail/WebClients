import { c } from 'ttag';

import { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { BRAND_NAME, MAIL_SHORT_APP_NAME, PASS_SHORT_APP_NAME, VPN_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { getMaxSpaceMap } from '../../helpers/getMaxSpaceMap';
import { getSecureStorageString } from '../../helpers/i18n';
import FeatureItem from '../FeatureItem/FeatureItem';

export const DriveFeatures = () => {
    const payments = usePaymentOptimistic();
    const maxSpace = getMaxSpaceMap(payments)[PLANS.DRIVE];

    return (
        <>
            <FeatureItem loading={!maxSpace} text={getSecureStorageString(maxSpace)} highlighted />
            <FeatureItem text={c('Signup').t`Encrypted cloud storage`} highlighted />
            <FeatureItem text={c('Signup').t`Securely share files, photos and documents`} highlighted />
            <FeatureItem text={c('Signup').t`Online document editor`} highlighted />
            <FeatureItem text={c('Signup').t`Recover previous file versions`} highlighted />
            <FeatureItem
                text={c('Signup')
                    .t`All basic ${BRAND_NAME} services (${MAIL_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME})`}
                highlighted
            />
        </>
    );
};
