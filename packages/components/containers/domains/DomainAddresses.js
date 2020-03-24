import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c, msgid } from 'ttag';
import { SimpleDropdown, DropdownMenu } from 'react-components';

const DomainAddresses = ({ domainAddresses }) => {
    const list = domainAddresses.map(({ ID, Email }) => (
        <div key={ID} className="inbl w100 pt0-5 pb0-5 ellipsis">
            {Email}
        </div>
    ));

    const n = list.length;

    return (
        <>
            <SimpleDropdown
                className="pm-button--link"
                content={c('Info').ngettext(msgid`${n} address`, `${n} addresses`, n)}
            >
                <DropdownMenu>{list}</DropdownMenu>
                <div className="alignright p1">
                    <Link className="pm-button" to="/settings/addresses">{c('Link').t`Manage`}</Link>
                </div>
            </SimpleDropdown>
        </>
    );
};

DomainAddresses.propTypes = {
    domainAddresses: PropTypes.array.isRequired
};

export default DomainAddresses;
