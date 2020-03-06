import React from 'react';
import { AppVersion } from 'react-components';
import changelog from '../../../../CHANGELOG.md';

const CalendarSidebarVersion = () => {
    return <AppVersion appName="ProtonCalendar" changelog={changelog} />;
};

export default CalendarSidebarVersion;
