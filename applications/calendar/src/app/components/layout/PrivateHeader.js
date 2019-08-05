import React from 'react';
import { MainLogo, Icon } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const PrivateHeader = () => {
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo currentApp={APPS.PROTONCALENDAR} />
            <div className="searchbox-container relative flex-item-centered-vert"></div>
            <div className="topnav-container flex-item-centered-vert flex-item-fluid">
                <ul className="topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap">
                    <li className="mr1">
                        <a
                            href="/calendar"
                            className="topnav-link inline-flex flex-nowrap nodecoration rounded"
                            aria-current="true"
                        >
                            <Icon name="calendar" className="topnav-icon mr0-5 flex-item-centered-vert fill-white" />
                            {c('Title').t`Calendar`}
                        </a>
                    </li>
                    <li className="mr1">
                        <a
                            href="/calendar/settings"
                            className="topnav-link inline-flex flex-nowrap nodecoration rounded"
                        >
                            <Icon
                                name="settings-master"
                                className="topnav-icon mr0-5 flex-item-centered-vert fill-white"
                            />
                            {c('Title').t`Settings`}
                        </a>
                    </li>
                </ul>
            </div>
        </header>
    );
};

export default PrivateHeader;
