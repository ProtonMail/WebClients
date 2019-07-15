import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useToggle, Toggle } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function RadioContainsAttachements({ comparator, onChange }) {
    const { state, toggle } = useToggle(comparator === 'contains');

    const handleChange = ({ target }) => {
        onChange(target.checked ? 'contains' : '!contains');
        toggle();
    };

    return (
        <label className="flex flex-nowrap flex-items-center">
            <Toggle className="mr0-5" checked={state} onChange={handleChange} />
            <span>{c('Option Filter').t`With Attachments`}</span>
        </label>
    );
}

RadioContainsAttachements.propTypes = {
    comparator: PropTypes.string,
    onChange: PropTypes.func
};

RadioContainsAttachements.defaultProps = {
    onChange: noop
};

export default RadioContainsAttachements;
