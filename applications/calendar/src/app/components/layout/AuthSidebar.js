import React from 'react';
import { useModals, NavMenu } from 'react-components';
import { c } from 'ttag';
import EventModal from '../modals/EventModal';
import MiniCalendar from '../MiniCalendar';

const AuthSidebar = () => {
    const { createModal } = useModals();
    const handleSelect = () => {};

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
        <div className="sidebar flex noprint">
            <MiniCalendar onSelect={handleSelect} />
            <nav className="navigation flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
            </nav>
        </div>
    );
};

export default AuthSidebar;
