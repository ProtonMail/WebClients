import React from 'react';
import { Sidebar, useModals } from 'react-components';
import { c } from 'ttag';
import EventModal from '../modals/EventModal';

const AuthSidebar = () => {
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

    return <Sidebar list={list} />;
};

export default AuthSidebar;
