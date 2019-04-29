import React from 'react';
import PropTypes from 'prop-types';
import { RoundedIcon } from 'react-components';
import { DOMAIN_STATE } from 'proton-shared/lib/constants';

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_ACTIVE, DOMAIN_STATE_WARN } = DOMAIN_STATE;

const DomainName = ({ domain }) => {
    const ICONS = {
        [DOMAIN_STATE_DEFAULT]: <RoundedIcon type="error" name="off" />,
        [DOMAIN_STATE_ACTIVE]: <RoundedIcon name="on" />,
        [DOMAIN_STATE_WARN]: <RoundedIcon type="warning" name="off" />
    };

    return (
        <>
            {ICONS[domain.State]} {domain.DomainName}
        </>
    );
};

DomainName.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DomainName;
