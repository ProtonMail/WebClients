import React from 'react';
import PropTypes from 'prop-types';
import { useModals, NavMenu } from 'react-components';
import { c } from 'ttag';

import EventModal from '../modals/EventModal';
import MiniCalendar from '../MiniCalendar';

const AuthSidebar = ({ onSelectDate, currentDate }) => {
    const { createModal } = useModals();

    const list = [
        {
            icon: 'plus',
            text: c('Action').t`Add event`,
            type: 'button',
            onClick() {
                createModal(<EventModal />);
            }
        },
        {
            icon: 'calendar',
            text: 'My calendar',
            link: '/calendar'
        }
    ];

    return (
        <div className="sidebar flex flex-column noprint">
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
