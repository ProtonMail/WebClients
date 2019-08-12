import React from 'react';
import PropTypes from 'prop-types';
import { MainLogo, Icon, UpgradeButton, useUser, UserDropdown, SupportDropdown } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { c } from 'ttag';

const PrivateHeader = ({ location }) => {
    const [{ isFree }] = useUser();
    const inSettings = location.pathname.startsWith('/calendar/settings');
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo currentApp={APPS.PROTONCALENDAR} />
            <div className="searchbox-container relative flex-item-centered-vert"></div>
            <div className="topnav-container flex-item-centered-vert flex-item-fluid">
                <ul className="topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap">
                    <li className="mr1">
                        <Link
                            to="/calendar"
                            className="topnav-link inline-flex flex-nowrap nodecoration rounded"
                            aria-current={!inSettings}
                        >
                            <Icon name="calendar" className="topnav-icon mr0-5 flex-item-centered-vert fill-white" />
                            {c('Title').t`Calendar`}
                        </Link>
                    </li>
                    <li className="mr1">
                        <Link
                            to="/calendar/settings"
                            className="topnav-link inline-flex flex-nowrap nodecoration rounded"
                            aria-current={inSettings}
                        >
                            <Icon
                                name="settings-master"
                                className="topnav-icon mr0-5 flex-item-centered-vert fill-white"
                            />
                            {c('Title').t`Settings`}
                        </Link>
                    </li>
                    {isFree ? (
                        <li className="mr1">
                            <UpgradeButton className="topnav-link inline-flex flex-nowrap nodecoration rounded" />
                        </li>
                    ) : null}
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

PrivateHeader.propTypes = {
    location: PropTypes.object
};

export default withRouter(PrivateHeader);
