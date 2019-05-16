import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from 'react-components';
import { c } from 'ttag';
import { CYCLE } from 'proton-shared/lib/constants';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const DISCOUNT = {
    [YEARLY]: '-20%',
    [TWO_YEARS]: '-33%'
};

const TOOLTIP = {
    [YEARLY]: c('Tooltip').t`Discount applied for annual billing cycle`,
    [TWO_YEARS]: c('Tooltip').t`Discount applied for two-year billing cycle`
};

const CycleDiscountBadge = ({ cycle }) => {
    if (cycle === MONTHLY) {
        return null;
    }

    return (
        <Badge type="success" tooltip={TOOLTIP[cycle]}>
            {DISCOUNT[cycle]}
        </Badge>
    );
};

CycleDiscountBadge.propTypes = {
    cycle: PropTypes.number.isRequired
};

export default CycleDiscountBadge;
