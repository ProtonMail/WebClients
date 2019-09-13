import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { DialogModal, HeaderModal, InnerModal, usePlans } from 'react-components';
import { c } from 'ttag';
import { CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import PlansTable from '../../../components/sections/plans/PlansTable';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const PlanComparisonModal = ({ modalTitleID = 'modalTitle', onClose, defaultCycle, defaultCurrency, ...rest }) => {
    const [cycle, setCycle] = useState(defaultCycle);
    const [currency, setCurrency] = useState(defaultCurrency);
    const [plans, loadingPlans] = usePlans();

    return (
        <DialogModal {...rest} onClose={onClose} className="pm-modal--wider">
            <HeaderModal hasClose modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`ProtonVPN plan comparison`}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    <PlansTable
                        expand={true}
                        subscription={null}
                        loading={loadingPlans}
                        currency={currency}
                        cycle={cycle}
                        updateCurrency={setCurrency}
                        updateCycle={setCycle}
                        plans={plans}
                    />
                </InnerModal>
            </div>
        </DialogModal>
    );
};

PlanComparisonModal.propTypes = {
    ...DialogModal.propTypes,
    cycle: PropTypes.oneOf([MONTHLY, TWO_YEARS, YEARLY]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired
};

export default PlanComparisonModal;
