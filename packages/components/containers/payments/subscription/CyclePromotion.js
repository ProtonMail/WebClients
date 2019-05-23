import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { CYCLE } from 'proton-shared/lib/constants';
import { Alert, SmallButton } from 'react-components';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const CyclePromotion = ({ model, onChange }) => {
    const handleClick = () => onChange({ ...model, cycle: YEARLY }, true);
    return (
        <>
            {model.cycle === MONTHLY && (
                <Alert>
                    <span className="mr0-5">{c('Info').t`Save 20% with annual`}</span>
                    <SmallButton onClick={handleClick}>{c('Action').t`Switch now`}</SmallButton>
                </Alert>
            )}
            {model.cycle === YEARLY && (
                <Alert>{c('Info').t`A 20% discount for annual billing has been automatically applied.`}</Alert>
            )}
            {model.cycle === TWO_YEARS && (
                <Alert>{c('Info').t`A 33% discount two year billing has been automatically applied.`}</Alert>
            )}
        </>
    );
};

CyclePromotion.propTypes = {
    model: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default CyclePromotion;
