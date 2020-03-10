import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, GiftCodeInput } from 'react-components';
import { isValid } from 'proton-shared/lib/helpers/giftCode';

const GiftCodeForm = ({ code, loading, disabled, onChange, onSubmit }) => {
    const handleEnter = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
        }
    };
    return (
        <div className="flex flex-nowrap flex-items-center flex-items-start">
            <div className="pr1 flex-item-fluid">
                <GiftCodeInput
                    value={code}
                    onChange={({ target }) => onChange(target.value)}
                    onKeyPress={handleEnter}
                />
            </div>
            <PrimaryButton
                title={c('Title').t`Apply gift code`}
                loading={loading}
                disabled={disabled || !isValid(code)}
                onClick={onSubmit}
            >{c('Action').t`Apply`}</PrimaryButton>
        </div>
    );
};

GiftCodeForm.propTypes = {
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    code: PropTypes.string
};

export default GiftCodeForm;
