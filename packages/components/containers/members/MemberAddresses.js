import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { msgid, c } from 'ttag';
import { Dropdown, DropdownMenu } from 'react-components';

const MemberAddresses = ({ addresses }) => {
    const list = addresses.map(({ ID, Email }) => (
        <div key={ID} className="inbl w100 pt0-5 pb0-5 ellipsis">
            {Email}
        </div>
    ));
    const title = list.join(', ');
    const n = list.length;

    return (
        <>
            <Dropdown
                caret
                title={title}
                className="pm-button pm-button--link"
                content={c('Info').ngettext(msgid`${n} address`, `${n} addresses`, n)}
            >
                <DropdownMenu className="p0-5">{list}</DropdownMenu>
                <div className="alignright p1">
                    <Link className="pm-button" to="/settings/addresses">{c('Link').t`Manage`}</Link>
                </div>
            </Dropdown>
        </>
    );
};

MemberAddresses.propTypes = {
    addresses: PropTypes.array.isRequired
};

export default MemberAddresses;
