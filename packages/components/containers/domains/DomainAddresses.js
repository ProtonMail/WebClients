import React from 'react';
import PropTypes from 'prop-types';
import { ngettext, msgid } from 'ttag';
import { CatchAllModal, SmallButton, useModal } from 'react-components';

const DomainAddresses = ({ domain }) => {
    const addresses = domain.addresses || [];
    const title = addresses.map(({ Email }) => Email).join(', ');
    const n = addresses.length;
    const { isOpen, open, close } = useModal();

    return (
        <>
            <SmallButton title={title} className="pm-button-link" onClick={open}>
                {ngettext(msgid`${n} address`, `${n} addresses`, n)}
            </SmallButton>
            <CatchAllModal show={isOpen} onClose={close} domain={domain} />
        </>
    );
};

DomainAddresses.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DomainAddresses;
