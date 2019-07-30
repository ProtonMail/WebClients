import React from 'react';
import PropTypes from 'prop-types';
import { useModals, NavMenu, DropdownActions, Checkbox, Loader, useEventManager, useApi } from 'react-components';
import { c } from 'ttag';
import { updateCalendar } from 'proton-shared/lib/api/calendars';

import EventModal from '../components/modals/EventModal';
import CalendarModal from '../components/modals/CalendarModal';
import CalendarsModal from '../components/modals/CalendarsModal';
import MiniCalendar from '../components/miniCalendar/MiniCalendar';

const OverviewSidebar = ({ calendars = [], loadingCalendars, onSelectDate, onSelectDateRange, currentDate }) => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();

    const handleVisibility = async (calendarID, checked) => {
        await api(updateCalendar(calendarID, { Display: +checked }));
        await call();
    };

    const calendarsView = (() => {
        if (loadingCalendars || !Array.isArray(calendars)) {
            return [<Loader key={0} />];
        }
        if (calendars.length === 0) {
            return ['No calendars'];
        }
        return calendars.map(({ ID, Name, Display, Color }) => {
            return (
                <div key={ID}>
                    <Checkbox
                        backgroundColor={Color}
                        checked={!!Display}
                        onClick={({ target: { checked } }) => handleVisibility(ID, checked)}
                    />
                    {Name}
                </div>
            );
        });
    })();

    const list = [
        {
            text: c('Header').t`Calendars`,
            type: 'button',
            className: 'alignleft',
            onClick() {
                createModal(<CalendarsModal />);
            }
        },
        ...calendarsView.map((node) => ({ type: 'text', text: node })),
        {
            text: c('Action').t`Add calendar`,
            type: 'button',
            className: 'alignleft',
            onClick() {
                createModal(<CalendarModal />);
            }
        }
    ];

    const createActions = [
        {
            text: c('Action').t`New event`,
            onClick() {
                createModal(<EventModal />);
            }
        },
        {
            text: c('Action').t`New task`,
            onClick() {
                createModal(<EventModal type="task" />);
            }
        },
        {
            text: c('Action').t`New alarm`,
            onClick() {
                createModal(<EventModal type="alarm" />);
            }
        }
    ];

    return (
        <div className="sidebar flex flex-column noprint">
            <div className="pl1 pr1 pb1">
                <DropdownActions className="pm-button-blue" list={createActions} />
            </div>
            <MiniCalendar date={currentDate} onSelectDate={onSelectDate} onSelectDateRange={onSelectDateRange} />
            <nav className="navigation flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
            </nav>
        </div>
    );
};

OverviewSidebar.propTypes = {
    onSelectDate: PropTypes.func,
    onSelectDateRange: PropTypes.func,
    currentDate: PropTypes.instanceOf(Date),
    calendars: PropTypes.array,
    loadingCalendars: PropTypes.bool
};

export default OverviewSidebar;
