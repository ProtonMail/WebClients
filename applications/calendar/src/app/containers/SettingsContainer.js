import React from 'react';
import { AppsSidebar, Sidebar, StorageSpaceStatus, Href } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { Route, Switch } from 'react-router';
import { c } from 'ttag';

import PrivateHeader from '../components/layout/PrivateHeader';
import GeneralPage from '../pages/GeneralPage';
import CalendarsPage from '../pages/CalendarsPage';

const SettingsContainer = () => {
    const list = [
        { link: '/calendar/settings', icon: 'settings-master', text: c('Link').t`General` },
        { link: '/calendar/settings/calendars', icon: 'calendar', text: c('Link').t`Calendars` }
    ];

    return (
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar
                currentApp={APPS.PROTONCALENDAR}
                items={[
                    <StorageSpaceStatus key="storage">
                        <Href url="/settings/subscription" className="pm-button pm-button--primary">
                            {c('Action').t`Upgrade`}
                        </Href>
                    </StorageSpaceStatus>
                ]}
            />
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader />
                <div className="flex flex-nowrap">
                    <Sidebar list={list} />
                    <div className="main flex-item-fluid main-area">
                        <Switch>
                            <Route path="/calendar/settings/calendars" component={CalendarsPage} />
                            <Route path="/calendar/settings" component={GeneralPage} />
                        </Switch>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsContainer;
