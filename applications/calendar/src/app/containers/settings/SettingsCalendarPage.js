import React from 'react';

import CalendarsSection from './section/CalendarsSection';
import Main from '../../components/Main';

const SettingsCalendarPage = ({ calendars }) => {
    return (
        <Main className="p2">
            <CalendarsSection calendars={calendars} />
        </Main>
    );
};

export default SettingsCalendarPage;
