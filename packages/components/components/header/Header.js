import React from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';

import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';


const Header = ({ user }) => {
    const list = [
        {
            text: t`Settings`,
            link: '/settings/account'
        },
        {
            text: t`Logout`,
            link: '/'
        }
    ];

    return (
        <header className="header flex flex-nowrap flex-spacebetween reset4print">
            <img src="" alt="ProtonWallet" />
            { user.Name }
            <Dropdown content="Profile">
                <DropdownMenu list={list}/>
            </Dropdown>
        </header>
    );
};

Header.propTypes = {
    user: PropTypes.object.isRequired
};

export default Header;
