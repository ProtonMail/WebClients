import React from 'react';
import PropTypes from 'prop-types';

const DropdownText = (props) => {
    return (
        <span className="DropdownText">
            {props.children}
        </span>
    );
};

DropdownText.propTypes = {
    children: PropTypes.string.isRequired
};

export default DropdownText;