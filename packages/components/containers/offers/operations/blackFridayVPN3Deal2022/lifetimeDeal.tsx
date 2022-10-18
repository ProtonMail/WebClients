import { c } from 'ttag';

import { Tooltip } from '../../../../components';

const LifetimeDeal = () => {
    return (
        <Tooltip
            title={c('specialOffer: Label')
                .t`The discount will continue to apply upon renewal until the subscription is canceled or modified`}
        >
            <span>{c('specialOffer: Label').t`Lifetime deal`}</span>
        </Tooltip>
    );
};

export default LifetimeDeal;
