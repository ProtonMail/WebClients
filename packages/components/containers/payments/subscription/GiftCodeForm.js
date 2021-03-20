import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, Input } from '../../../components';

const GiftCodeForm = ({ code, loading, disabled, onChange, onSubmit }) => {
    const handleEnter = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
        }
    };
    return (
        <div className="flex flex-nowrap flex-align-items-center flex-align-items-start">
            <div className="pr0-5 flex-item-fluid">
                <Input
                    value={code}
                    placeholder={c('Placeholder').t`Gift code`}
                    onChange={({ target }) => onChange(target.value)}
                    onKeyPress={handleEnter}
                />
            </div>
            <PrimaryButton
                title={c('Title').t`Apply gift code`}
                loading={loading}
                disabled={disabled || !code}
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
    code: PropTypes.string,
};

export default GiftCodeForm;
