import React from 'react';
import PropTypes from 'prop-types';

import CalendarsSection from './section/CalendarsSection';
import Main from '../../components/Main';

const SettingsCalendarPage = ({ calendars, calendarUserSettings, loading }) => {
    return (
        <Main className="p2">
            <CalendarsSection calendars={calendars} calendarUserSettings={calendarUserSettings} disabled={loading} />
        </Main>
    );
};

SettingsCalendarPage.propTypes = {
    calendars: PropTypes.array,
    calendarUserSettings: PropTypes.object,
    loading: PropTypes.bool
};

export default SettingsCalendarPage;
