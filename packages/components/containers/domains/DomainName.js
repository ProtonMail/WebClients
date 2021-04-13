import React from 'react';
import PropTypes from 'prop-types';
import { DOMAIN_STATE } from 'proton-shared/lib/constants';

import { Icon } from '../../components';

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_ACTIVE, DOMAIN_STATE_WARN } = DOMAIN_STATE;

const DomainName = ({ domain }) => {
    const ICONS = {
        [DOMAIN_STATE_DEFAULT]: (
            <Icon className="color-danger flex-item-noshrink" type="error" name="times-circle-filled" />
        ),
        [DOMAIN_STATE_ACTIVE]: <Icon className="color-success flex-item-noshrink" name="check-circle-filled" />,
        [DOMAIN_STATE_WARN]: (
            <Icon className="color-warning flex-item-noshrink" type="warning" name="times-circle-filled" />
        ),
    };

    return (
        <span className="flex flex-nowrap flex-align-items-center">
            {ICONS[domain.State]}
            <span className="text-ellipsis ml0-5" title={domain.DomainName}>
                {domain.DomainName}
            </span>
        </span>
    );
};

DomainName.propTypes = {
    domain: PropTypes.object.isRequired,
};

export default DomainName;
