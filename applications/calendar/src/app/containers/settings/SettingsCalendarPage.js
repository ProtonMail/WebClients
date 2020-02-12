import React from 'react';
import PropTypes from 'prop-types';

import CalendarsSection from './section/CalendarsSection';
import Main from '../../components/Main';

const SettingsCalendarPage = ({ calendars, defaultCalendarID, loading }) => {
    return (
        <Main className="p2">
            <CalendarsSection calendars={calendars} defaultCalendarID={defaultCalendarID} disabled={loading} />
        </Main>
    );
};

SettingsCalendarPage.propTypes = {
    calendars: PropTypes.array,
    defaultCalendarID: PropTypes.oneOfType([PropTypes.string, null]),
    loading: PropTypes.bool
};

export default SettingsCalendarPage;
