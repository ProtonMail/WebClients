import React from 'react';
import PropTypes from 'prop-types';
import { msgid, c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { AppLink, SimpleDropdown, DropdownMenu } from '../../components';

const MemberAddresses = ({ member, addresses }) => {
    const list = addresses.map(({ ID, Email }) => (
        <div key={ID} className="w100 flex flex-nowrap pl1 pr1 pt0-5 pb0-5">
            <span className="ellipsis" title={Email}>
                {Email}
            </span>
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

    if (!n) {
        return <>{contentDropDown}</>;
    }

    return (
        <>
            <SimpleDropdown className="pm-button--link" content={contentDropDown}>
                <div className="dropDown-item pt0-5 pb0-5 pl1 pr1 flex">
                    <AppLink
                        className="pm-button w100 aligncenter"
                        to={`/organization/${member.ID}#addresses`}
                        toApp={APPS.PROTONACCOUNT}
                    >{c('Link').t`Manage`}</AppLink>
                </div>
                <DropdownMenu>{list}</DropdownMenu>
            </SimpleDropdown>
        </>
    );
};

MemberAddresses.propTypes = {
    member: PropTypes.object.isRequired,
    addresses: PropTypes.array.isRequired,
};

export default MemberAddresses;
