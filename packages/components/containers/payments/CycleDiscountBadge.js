import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { CYCLE } from 'proton-shared/lib/constants';

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

const CycleDiscountBadge = ({ cycle = MONTHLY }) => {
    if (cycle === MONTHLY) {
        return null;
    }
    const i18n = getTooltipI18N();

    return (
        <Badge type="light" tooltip={i18n[cycle]}>
            {DISCOUNT[cycle]}
        </Badge>
    );
};

CycleDiscountBadge.propTypes = {
    cycle: PropTypes.number.isRequired,
};

export default CycleDiscountBadge;
