import React from 'react';
import { PrimaryButton, ConfirmModal, useModals } from 'react-components';

export default { component: ConfirmModal, title: 'Proton UI / Modal' };

export const Basic = () => {
    const { createModal } = useModals();

    const handleClick = () => {
        createModal(<ConfirmModal />);
    };

    return <PrimaryButton onClick={handleClick}>Open modal</PrimaryButton>;
};
