import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Link } from 'react-components';

const MobileNavLink = ({ icon = '', to = '', external = false, current = false }) => {
    return (
        <Link to={to} external={external} aria-current={current} className="flex aside-link">
            <Icon name={icon} className="aside-linkIcon mauto fill-global-light" />
        </Link>
    );
};

MobileNavLink.propTypes = {
    icon: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    external: PropTypes.bool,
    current: PropTypes.bool
};

export default MobileNavLink;
