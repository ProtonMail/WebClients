import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c, msgid } from 'ttag';
import { SimpleDropdown, DropdownMenu } from 'react-components';

const DomainAddresses = ({ domainAddresses }) => {
    const list = domainAddresses.map(({ ID, Email }) => (
        <div key={ID} className="inbl w100 pt0-5 pb0-5 pl1 pr1 ellipsis">
            {Email}
        </div>
    ));

    const n = list.length;
    const addressesTxt = ` ${c('Info').ngettext(msgid`address`, `addresses`, n)}`;
    const contentDropDown = (
        <>
            {n}
            <span className="nomobile">{addressesTxt}</span>
        </>
    ); // trick for responsive and mobile display

    return (
        <>
            <SimpleDropdown className="pm-button--link" content={contentDropDown}>
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
