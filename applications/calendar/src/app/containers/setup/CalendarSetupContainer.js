import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCalendars, useModals, useUser } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { startOfWeek, endOfWeek } from 'proton-shared/lib/date-fns-utc';

import FreeModal from './FreeModal';
import WelcomeModal from './WelcomeModal';

import CalendarContainerView from '../calendar/CalendarContainerView';
import TimeGrid from '../../components/calendar/TimeGrid';
import { VIEWS } from '../../constants';

const CalendarSetupContainer = ({ children }) => {
    const { createModal } = useModals();
    const [calendars] = useCalendars();
    const [{ isFree }] = useUser();

    useEffect(() => {
        if (isFree) {
            createModal(<FreeModal disableCloseOnEscape={true} disableCloseOnLocation={true} />);
            return;
        }
        if (Array.isArray(calendars) && calendars.length) {
            return;
        }
        createModal(<WelcomeModal disableCloseOnEscape={true} disableCloseOnLocation={true} />);
    }, []);

    if (calendars.length > 0) {
        return children;
    }

    const now = new Date();
    const dateRange = [startOfWeek(now), endOfWeek(now)];

    return (
        <CalendarContainerView
            view={VIEWS.WEEK}
            isBlurred={true}
            utcDate={now}
            utcDefaultDate={now}
            utcDateRange={dateRange}
            onCreateEvent={noop}
            onClickToday={noop}
            onChangeView={noop}
            tzid={'Europe/Zurich'}
            setTzid={noop}
            setCustom={noop}
        >
            <TimeGrid now={now} date={now} dateRange={dateRange} components={{}} />
        </CalendarContainerView>
    );
};

CalendarSetupContainer.propTypes = {
    children: PropTypes.node
};

export default CalendarSetupContainer;
