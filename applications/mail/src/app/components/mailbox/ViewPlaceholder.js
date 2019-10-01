import React from 'react';
import PropTypes from 'prop-types';

const ViewPlaceholder = ({ selectedIDs = [], onUncheckAll }) => {
    return <>ViewPlaceholder</>;
};

ViewPlaceholder.propTypes = {
    selectedIDs: PropTypes.array,
    onUncheckAll: PropTypes.func
};

export default ViewPlaceholder;
