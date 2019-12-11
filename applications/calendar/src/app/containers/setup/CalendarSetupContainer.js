import React, { useRef, useState } from 'react';
import { useModals } from 'react-components';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { startOfWeek, endOfWeek } from 'proton-shared/lib/date-fns-utc';
import { CALENDAR_FLAGS } from 'proton-shared/lib/calendar/constants';

import FreeModal from './FreeModal';
import WelcomeModal from './WelcomeModal';
import ResetModal from './ResetModal';

import CalendarContainerView from '../calendar/CalendarContainerView';
import TimeGrid from '../../components/calendar/TimeGrid';
import { VIEWS } from '../../constants';

const RESET_MASK = CALENDAR_FLAGS.RESET_NEEDED | CALENDAR_FLAGS.INCOMPLETE_SETUP | CALENDAR_FLAGS.UPDATE_PASSPHRASE;

const CalendarSetupContainer = ({ calendars, user: { isFree }, children }) => {
    const { createModal } = useModals();
    const timeGridViewRef = useRef();

    const [hasModal, setHasModal] = useState(() => {
        const hasCalendarsToReset = calendars.some(({ Flags }) => {
            return (Flags & RESET_MASK) > 0;
        });
        const isNoCalendarSetup = calendars.length === 0;

        const getModal = () => {
            if (isNoCalendarSetup && isFree) {
                return <FreeModal />;
            }

            const reset = () => setHasModal(false);

            if (isNoCalendarSetup) {
                return <WelcomeModal onExit={reset} />;
            }

            if (hasCalendarsToReset) {
                return <ResetModal calendars={calendars} onExit={reset} />;
            }
        };

        const modal = getModal();

        if (modal) {
            createModal(modal);
            return true;
        }

        return false;
    });

    if (hasModal) {
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
                <TimeGrid now={now} date={now} dateRange={dateRange} components={{}} ref={timeGridViewRef} />
            </CalendarContainerView>
        );
    }

    return children;
};

CalendarSetupContainer.propTypes = {
    children: PropTypes.node
};

export default CalendarSetupContainer;
