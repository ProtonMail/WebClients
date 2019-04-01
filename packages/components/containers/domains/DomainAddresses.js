import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ngettext, msgid, c } from 'ttag';
import { Dropdown, DropdownMenu, Icon } from 'react-components';

const DomainAddresses = ({ domain }) => {
    const addresses = domain.addresses || [];
    const title = addresses.map(({ Email }) => Email).join(', ');
    const list = addresses.map(({ Email: text }) => ({ text }));
    const n = addresses.length;

    return (
        <>
            <Dropdown
                title={title}
                className="pm-button--link"
                content={
                    <>
                        {ngettext(msgid`${n} address`, `${n} addresses`, n)} <Icon name="caret" />
                    </>
                }
            >
                <DropdownMenu list={list} />
                <div className="alignright">
                    <Link className="pm-button pm-button--small" to="/settings/addresses">{c('Link').t`Manage`}</Link>
                </div>
            </Dropdown>
        </>
    );
};

DomainAddresses.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DomainAddresses;
