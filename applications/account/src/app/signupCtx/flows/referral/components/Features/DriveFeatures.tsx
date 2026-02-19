import { c } from 'ttag';

import { IcImage } from '@proton/icons/icons/IcImage';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';

import { getMaxSpaceMap } from '../../helpers/getMaxSpaceMap';
import { getSecureStorageString } from '../../helpers/i18n';
import FeatureItem from '../FeatureItem/FeatureItem';

export const DriveFeatures = () => {
    const payments = usePaymentOptimistic();
    const maxSpace = getMaxSpaceMap(payments)[PLANS.DRIVE];

    return (
        <>
            <FeatureItem
                icon={<IcStorage size={5} />}
                loading={!maxSpace}
                text={getSecureStorageString(maxSpace)}
                highlighted
            />
            <FeatureItem
                icon={<IcImage size={5} />}
                text={c('Signup').t`Securely share files and photos`}
                highlighted
            />
            <FeatureItem icon={<IcPenSquare size={5} />} text={c('Signup').t`Online document editor`} highlighted />
        </>
    );
};
