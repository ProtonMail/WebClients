import React from 'react';
import { c } from 'ttag';
import { Dropdown, DropdownMenu, useUser, useAuthentication } from 'react-components';

const Header = () => {
    const [user] = useUser();
    const authenticationStore = useAuthentication();
    const list = [
        {
            text: c('Link').t`Logout ${user.Name}`,
            type: 'button',
            onClick: () => authenticationStore.logout()
        }
    ];

    return (
        <header className="header flex flex-nowrap flex-spacebetween reset4print">
            <img src="https://mail.protonmail.com/assets/img/logo.png" alt="Proton basic auth app" />
            <Dropdown content="Profile">
                <DropdownMenu list={list} />
            </Dropdown>
        </header>
    );
};

export default Header;
