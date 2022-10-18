import { c } from 'ttag';

import { Tooltip } from '../../../../components';

const LifetimeDeal = () => {
    return (
        <Tooltip
            title={c('specialoffer: Label')
                .t`The discount will continue to apply upon renewal until the subscription is canceled or modified`}
        >
            <span>{c('specialoffer: Label').t`Lifetime deal`}</span>
        </Tooltip>
    );
};

export default LifetimeDeal;
