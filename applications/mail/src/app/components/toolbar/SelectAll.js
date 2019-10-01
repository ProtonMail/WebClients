import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'react-components';

const SelectAll = ({ loading, disabled, checked, onCheck }) => {
    return (
        <Checkbox
            className="flex pl1 pr1"
            checked={checked}
            disabled={disabled}
            loading={loading}
            onChange={({ target }) => onCheck(target.checked)}
        />
    );
};

SelectAll.propTypes = {
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    checked: PropTypes.bool.isRequired,
    onCheck: PropTypes.func.isRequired
};

export default SelectAll;
