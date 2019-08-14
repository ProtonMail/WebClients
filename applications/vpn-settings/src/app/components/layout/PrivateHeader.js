import React from 'react';
import { MainLogo, SupportDropdown, UserDropdown } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

const PrivateHeader = () => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo currentApp={APPS.PROTONVPN_SETTINGS} url="/account" />
            <div className="searchbox-container"></div>
            <div className="topnav-container flex-item-centered-vert flex-item-fluid">
                <ul className="topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap">
                    <li className="mr1">
                        <SupportDropdown />
                    </li>
                    <li className="mlauto mtauto mbauto relative flex-item-noshrink">
                        <UserDropdown />
                    </li>
                </ul>
            </div>
        </header>
    );
};

export default PrivateHeader;
