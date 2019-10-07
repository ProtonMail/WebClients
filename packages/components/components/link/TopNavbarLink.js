import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Href } from 'react-components';
import { Link } from 'react-router-dom';

const TopNavbarLink = ({ to, external = false, icon, text, ...rest }) => {
    const iconComponent = <Icon className="topnav-icon mr0-5 flex-item-centered-vert fill-white" name={icon} />;

    if (external) {
        return (
            <Href url={to} target="_self" rel="noreferrer help" {...rest}>
                {iconComponent}
                <span className="navigation-title topnav-linkText">{text}</span>
            </Href>
        );
    }

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
    text: PropTypes.string.isRequired,
    external: PropTypes.bool
};

export default TopNavbarLink;
