import React from 'react';
import { c } from 'ttag';

import { Button, ButtonLike } from '../../components/button';
import { SettingsLink } from '../../components/link';
import { AlertModal } from '../../components/alertModal';

interface Props {
    children: React.ReactNode;
    onClose: () => void;
    isOpen: boolean;
}

const CalendarLimitReachedModal = ({ children, onClose, isOpen }: Props) => (
    <AlertModal
        open={isOpen}
        title={c('Modal title').t`Unable to add more calendars`}
        buttons={[
            <ButtonLike color="norm" as={SettingsLink} path="/calendars">
                {c('Modal action').t`Manage calendars`}
            </ButtonLike>,
            <Button onClick={onClose}>{c('Modal action').t`Close`}</Button>,
        ]}
        onClose={onClose}
    >
        {children}
    </AlertModal>
);

export default CalendarLimitReachedModal;
