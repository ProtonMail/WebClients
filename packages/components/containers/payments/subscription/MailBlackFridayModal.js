import React from 'react';
import PropTypes from 'prop-types';
import { toMap } from 'proton-shared/lib/helpers/object';
import { CYCLE, BLACK_FRIDAY } from 'proton-shared/lib/constants';

import BlackFridayModal from './BlackFridayModal';

const MailBlackFridayModal = ({ plans = [], ...rest }) => {
    const plansMap = toMap(plans, 'Name');
    const bundles = [
        {
            name: 'ProtonMail Plus',
            cycle: CYCLE.YEARLY,
            planIDs: [plansMap.plus.ID],
            couponCode: BLACK_FRIDAY.COUPON_CODE
        },
        {
            name: 'ProtonMail Plus',
            cycle: CYCLE.TWO_YEARS,
            planIDs: [plansMap.plus.ID],
            couponCode: BLACK_FRIDAY.COUPON_CODE,
            popular: true
        },
        {
            name: 'Mail Plus & VPN Plus',
            cycle: CYCLE.TWO_YEARS,
            planIDs: [plansMap.plus.ID, plansMap.vpnplus.ID],
            couponCode: BLACK_FRIDAY.COUPON_CODE
        }
    ];

    return <BlackFridayModal bundles={bundles} className="blackfriday-mail-modal" {...rest} />;
};

MailBlackFridayModal.propTypes = {
    plans: PropTypes.arrayOf(
        PropTypes.shape({
            ID: PropTypes.string.isRequired,
            Name: PropTypes.string.isRequired
        })
    ).isRequired
};

export default MailBlackFridayModal;
