import { c } from 'ttag';

import { Tooltip } from '@proton/components/components';
import verifiedBadge from '@proton/styles/assets/img/illustrations/verified-badge.svg';

const VerifiedBadge = () => {
    return (
        <Tooltip title={c('Info').t`Verified Proton message`}>
            <img src={verifiedBadge} alt={c('Info').t`Verified Proton message`} className="ml0-25" />
        </Tooltip>
    );
};

export default VerifiedBadge;
