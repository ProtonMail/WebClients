import React from 'react';
import PropTypes from 'prop-types';
import { getClasses } from '../../helpers/component';

const NavIcon = (props) => {
    return (
        <i className={getClasses('fa', props.className)}></i>
    );
};

NavIcon.propTypes = {
    className: PropTypes.string
};

export default NavIcon;