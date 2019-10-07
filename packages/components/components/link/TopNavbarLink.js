import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';
import { Link } from 'react-router-dom';

const TopNavbarLink = ({ to, icon, text, ...rest }) => {
    const iconComponent = <Icon className="topnav-icon mr0-5 flex-item-centered-vert fill-white" name={icon} />;

    return (
        <Link to={to} {...rest}>
            {iconComponent}
            <span className="navigation-title topnav-linkText">{text}</span>
        </Link>
    );
};

TopNavbarLink.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.string,
    text: PropTypes.string.isRequired
};

export default TopNavbarLink;
