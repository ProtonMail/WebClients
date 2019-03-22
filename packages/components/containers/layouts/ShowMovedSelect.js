import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Select } from 'react-components';

const ShowMovedSelect = ({ showMoved, handleChange, loading }) => {
    const options = [{ text: c('Option').t`Include Moved`, value: 3 }, { text: c('Option').t`Hide Moved`, value: 0 }];

    return <Select value={showMoved} options={options} disabled={loading} onChange={handleChange} />;
};

ShowMovedSelect.propTypes = {
    showMoved: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default ShowMovedSelect;
