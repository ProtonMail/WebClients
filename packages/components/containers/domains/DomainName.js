import React from 'react';
import PropTypes from 'prop-types';
import { DOMAIN_STATE } from 'proton-shared/lib/constants';
import { RoundedIcon } from '../../components';

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_ACTIVE, DOMAIN_STATE_WARN } = DOMAIN_STATE;

const DomainName = ({ domain }) => {
    const ICONS = {
        [DOMAIN_STATE_DEFAULT]: <RoundedIcon type="error" name="off" />,
        [DOMAIN_STATE_ACTIVE]: <RoundedIcon name="on" />,
        [DOMAIN_STATE_WARN]: <RoundedIcon type="warning" name="off" />,
    };

    return (
        <span className="flex flex-nowrap">
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
