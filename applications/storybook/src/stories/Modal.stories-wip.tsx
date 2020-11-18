import React from 'react';
import {Meta} from '@storybook/react/types-6-0';
import { PrimaryButton, ConfirmModal, useModals } from 'react-components';

export default {component: ConfirmModal, title: 'Proton UI / Modal'} as Meta;

export const Basic = () => {
    const { createModal } = useModals();

    const handleClick = () => {
        createModal(<ConfirmModal/>)
    }

    return (
        <PrimaryButton onClick={handleClick}>
            Open modal
        </PrimaryButton>
    );
};
