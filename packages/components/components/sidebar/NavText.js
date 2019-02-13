import React from 'react';
import PropTypes from 'prop-types';

const NavText = (props) => {
    return (
        <span className="NavText">
            {props.children}
        </span>
    );
};

NavText.propTypes = {
    children: PropTypes.string.isRequired
};

export default NavText;