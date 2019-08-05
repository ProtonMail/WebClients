import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { msgid, c } from 'ttag';
import { SimpleDropdown, DropdownMenu } from 'react-components';

const MemberAddresses = ({ member, addresses }) => {
    const list = addresses.map(({ ID, Email }) => (
        <div key={ID} className="inbl w100 pt0-5 pb0-5 ellipsis">
            {Email}
        </div>
    ));
    const title = list.join(', ');
    const n = list.length;

    return (
        <>
            <SimpleDropdown
                title={title}
                className="pm-button--link"
                content={c('Info').ngettext(msgid`${n} address`, `${n} addresses`, n)}
            >
                <DropdownMenu>{list}</DropdownMenu>
                <div className="alignright p1">
                    <Link className="pm-button" to={`/settings/addresses/${member.ID}`}>{c('Link').t`Manage`}</Link>
                </div>
            </SimpleDropdown>
        </>
    );
};

MemberAddresses.propTypes = {
    member: PropTypes.object.isRequired,
    addresses: PropTypes.array.isRequired
};

export default MemberAddresses;
