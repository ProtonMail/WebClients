import { c } from 'ttag';

import { DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';

const RecoveryWarning = () => (
    <div className="fade-in">
        <DashboardCardDivider />
        <div className="flex items-center gap-2 flex-nowrap">
            <IcExclamationCircleFilled className="color-danger shrink-0" />
            <p className="m-0">{c('Label')
                .t`Make sure you have access to a recovery email or phone, and have a data recovery option.`}</p>
        </div>
    </div>
);

export default RecoveryWarning;
