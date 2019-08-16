import React from 'react';
import PropTypes from 'prop-types';
import { useModals, NavMenu, DropdownActions, Checkbox, useEventManager, useApi } from 'react-components';
import { c } from 'ttag';
import { updateCalendar } from 'proton-shared/lib/api/calendars';

import EventModal from '../components/modals/EventModal';

const CalendarSidebar = ({ calendars = [], loadingCalendars, miniCalendar }) => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();

    const handleVisibility = async (calendarID, checked) => {
        await api(updateCalendar(calendarID, { Display: +checked }));
        await call();
    };

    const calendarsListView = (() => {
        if (loadingCalendars || !Array.isArray(calendars)) {
            return null;
        }
        if (calendars.length === 0) {
            return null;
        }
        return calendars.map(({ ID, Name, Display, Color }) => {
            return (
                <div className="navigation__link" key={ID}>
                    <span className="flex flex-nowrap flex-items-center">
                        <Checkbox
                            className="mr1"
                            backgroundColor={Color}
                            checked={!!Display}
                            onChange={({ target: { checked } }) => handleVisibility(ID, checked)}
                        />
                        <span className="ellipsis mw100">{Name}</span>
                    </span>
                </div>
            );
        });
    })();

    const list = [
        {
            icon: 'general',
            text: c('Header').t`Calendars`,
            link: '/calendar/settings/calendars'
        }
    ];

    const createActions = [
        {
            text: c('Action').t`New event`,
            onClick() {
                createModal(<EventModal />);
            }
        }
        // {
        //     text: c('Action').t`New task`,
        //     onClick() {
        //         createModal(<EventModal type="task" />);
        //     }
        // },
        // {
        //     text: c('Action').t`New alarm`,
        //     onClick() {
        //         createModal(<EventModal type="alarm" />);
        //     }
        // }
    ];

    return (
        <div className="sidebar flex flex-column noprint">
            <div className="pl1 pr1 pb1">
                <DropdownActions className="pm-button-blue" list={createActions} />
            </div>
            {miniCalendar}
            <nav className="navigation flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
                {calendarsListView}
            </nav>
        </div>
    );
};

CalendarSidebar.propTypes = {
    miniCalendar: PropTypes.node,
    calendars: PropTypes.array,
    loadingCalendars: PropTypes.bool
};

export default CalendarSidebar;
