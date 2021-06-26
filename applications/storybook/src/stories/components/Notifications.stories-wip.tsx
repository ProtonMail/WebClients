import React from 'react';
import { PrimaryButton, ConfirmModal, useNotifications } from 'react-components';

export default { component: ConfirmModal, title: 'Proton UI / Notifications' };

export const Basic = () => {
    const { createNotification } = useNotifications();

    const handleClick = () => {
        createNotification({
            type: 'success',
            text: 'Success!',
        });
    };

    return <PrimaryButton onClick={handleClick}>Create notification</PrimaryButton>;
};
