import { c } from 'ttag';
import { CYCLE } from '@proton/shared/lib/constants';
import { Cycle } from '@proton/shared/lib/interfaces';

import { Badge } from '../../components';

interface Props {
    cycle?: Cycle;
}

const CycleDiscountBadge = ({ cycle = CYCLE.MONTHLY }: Props) => {
    if (cycle === CYCLE.YEARLY) {
        return (
            <Badge type="success" tooltip={c('Tooltip').t`Discount applied for annual billing cycle`}>
                -20%
            </Badge>
        );
    }

    if (cycle === CYCLE.TWO_YEARS) {
        return (
            <Badge type="success" tooltip={c('Tooltip').t`Discount applied for two-year billing cycle`}>
                -33%
            </Badge>
        );
    }

    return null;
};

export default CycleDiscountBadge;
