import { c } from 'ttag';

import { Tooltip } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import verifiedBadge from '@proton/styles/assets/img/illustrations/verified-badge.svg';

const VerifiedBadge = () => {
    return (
        <Tooltip title={c('Info').t`Verified ${BRAND_NAME} message`}>
            <img src={verifiedBadge} alt={c('Info').t`Verified ${BRAND_NAME} message`} className="ml0-25 flex-item-noshrink" />
        </Tooltip>
    );
};

export default VerifiedBadge;
