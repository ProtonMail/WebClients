import React from 'react';
import { MainLogo } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

const PrivateHeader = () => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo currentApp={APPS.PROTONVPN_SETTINGS} url="/account" />
            <div className="searchbox-container"></div>
            <div className="topnav-container flex-item-centered-vert flex-item-fluid"></div>
        </header>
    );
};

export default PrivateHeader;
