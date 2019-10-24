import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Link } from 'react-router-dom';

import { Icon } from 'react-components';

const UpgradeButton = ({ className, external = false }) => {
    if (external) {
        return (
            <a href="/settings/subscription" className={className}>
                <Icon name="upgrade-to-paid" className="topnav-icon mr0-5 flex-item-centered-vert fill-white" />
                <span className="navigation-title topnav-linkText">{c('Link').t`Upgrade`}</span>
            </a>
        );
    }

    return (
        <Link to="/settings/subscription" className={className}>
            <Icon name="upgrade-to-paid" className="topnav-icon mr0-5 flex-item-centered-vert fill-white" />
            <span className="navigation-title topnav-linkText">{c('Link').t`Upgrade`}</span>
        </Link>
    );
};

UpgradeButton.propTypes = {
    className: PropTypes.string,
    external: PropTypes.bool
};

export default UpgradeButton;
