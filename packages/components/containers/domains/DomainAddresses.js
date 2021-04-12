import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';

import { ButtonLike, AppLink, SimpleDropdown, DropdownMenu } from '../../components';

const DomainAddresses = ({ domainAddresses }) => {
    const list = domainAddresses.map(({ ID, Email }) => (
        <div key={ID} className="inline-block w100 pt0-5 pb0-5 pl1 pr1 text-ellipsis" title={Email}>
            {Email}
        </div>
    ));

    const n = list.length;
    const addressesTxt = `${c('Info').ngettext(msgid`address`, `addresses`, n)}`;
    const contentDropDown = (
        <>
            {n}
            <span className="no-mobile pl0-25">{addressesTxt}</span>
        </>
    ); // trick for responsive and mobile display

    if (!n) {
        return <>{contentDropDown}</>;
    }

    return (
        <>
            <SimpleDropdown shape="link" color="norm" content={contentDropDown}>
                <DropdownMenu>{list}</DropdownMenu>
                <div className="text-right p1">
                    <ButtonLike as={AppLink} to="/organization#addresses" toApp={APPS.PROTONACCOUNT}>{c('Link')
                        .t`Manage`}</ButtonLike>
                </div>
            </SimpleDropdown>
        </>
    );
};

DomainAddresses.propTypes = {
    domainAddresses: PropTypes.array.isRequired,
};

export default DomainAddresses;
