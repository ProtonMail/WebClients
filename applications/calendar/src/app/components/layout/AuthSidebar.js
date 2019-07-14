import React from 'react';
import PropTypes from 'prop-types';
import { useModals, NavMenu, DropdownActions } from 'react-components';
import { c } from 'ttag';

import EventModal from '../modals/EventModal';
import CalendarModal from '../modals/CalendarModal';
import CalendarsModal from '../modals/CalendarsModal';
import MiniCalendar from '../MiniCalendar';

const AuthSidebar = ({ onSelectDate, currentDate }) => {
    const { createModal } = useModals();

    const list = [
        {
            text: c('Header').t`Calendars`,
            type: 'button',
            className: 'alignleft',
            onClick() {
                createModal(<CalendarsModal />);
            }
        },
        {
            text: 'My proton calendar',
            link: '/calendar'
        },
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
            text: c('Action').t`Create event`,
            onClick() {
                createModal(<EventModal />);
            }
        },
        {
            text: c('Action').t`Create task`,
            onClick() {
                createModal(<EventModal type="task" />);
            }
        },
        {
            text: c('Action').t`Create alarm`,
            onClick() {
                createModal(<EventModal type="alarm" />);
            }
        }
    ];

    return (
        <div className="sidebar flex flex-column noprint">
            <div className="p1">
                <DropdownActions className="pm-button-blue" list={createActions} />
            </div>
            <MiniCalendar date={currentDate} onSelect={onSelectDate} />
            <nav className="navigation flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
            </nav>
        </div>
    );
};

AuthSidebar.propTypes = {
    onSelectDate: PropTypes.func,
    currentDate: PropTypes.instanceOf(Date)
};

export default AuthSidebar;
