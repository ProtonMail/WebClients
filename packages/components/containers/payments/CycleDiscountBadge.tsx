import { c } from 'ttag';
import { CYCLE } from '@proton/shared/lib/constants';
import { Cycle } from '@proton/shared/lib/interfaces';

import { Badge } from '../../components';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const DISCOUNT = {
    [YEARLY]: '-20%',
    [TWO_YEARS]: '-33%',
};

const getTooltipI18N = () => ({
    [YEARLY]: c('Tooltip').t`Discount applied for annual billing cycle`,
    [TWO_YEARS]: c('Tooltip').t`Discount applied for two-year billing cycle`,
});

interface Props {
    cycle?: Cycle;
}

const CycleDiscountBadge = ({ cycle = MONTHLY }: Props) => {
    if (cycle === MONTHLY) {
        return null;
    }
    const i18n = getTooltipI18N();

    return (
        <Badge type="success" tooltip={i18n[cycle]}>
            {DISCOUNT[cycle]}
        </Badge>
    );
};

export default CycleDiscountBadge;
