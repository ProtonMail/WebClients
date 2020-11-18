import React from 'react';
import {Meta} from '@storybook/react/types-6-0';
import { PrimaryButton, ConfirmModal, useNotifications } from 'react-components';

export default {component: ConfirmModal, title: 'Proton UI / Notifications'} as Meta;

export const Basic = () => {
    const { createNotification } = useNotifications();

    const handleClick = () => {
        createNotification({
            type: 'success',
            text: 'Success!'
        });
    }

    return (
        <PrimaryButton onClick={handleClick}>
            Create notification
        </PrimaryButton>
    );
};
