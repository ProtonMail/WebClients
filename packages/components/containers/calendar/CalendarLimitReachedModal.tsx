import React from 'react';

import { c } from 'ttag';

import { CALENDAR_TYPE } from '@proton/shared/lib/interfaces/calendar';

import { AlertModal } from '../../components/alertModal';
import { Button, ButtonLike } from '../../components/button';
import { SettingsLink } from '../../components/link';

interface Props {
    onClose?: () => void;
    open?: boolean;
    calendarType: CALENDAR_TYPE;
}

const CalendarLimitReachedModal = ({ open, onClose, calendarType }: Props) => {
    const text =
        calendarType === CALENDAR_TYPE.PERSONAL
            ? c('Modal for limit of calendars reached')
                  .t`Unable to create more calendars. You have reached the maximum of personal calendars within your plan.`
            : c('Modal for limit of calendars reached')
                  .t`Unable to add more calendars. You have reached the maximum of subscribed calendars within your plan.`;

    return (
        <AlertModal
            open={open}
            title={c('Modal title').t`Unable to add more calendars`}
            buttons={[
                <ButtonLike color="norm" as={SettingsLink} path="/calendars">
                    {c('Modal action').t`Manage calendars`}
                </ButtonLike>,
                <Button onClick={onClose}>{c('Modal action').t`Close`}</Button>,
            ]}
            onClose={onClose}
        >
            {text}
        </AlertModal>
    );
};

export default CalendarLimitReachedModal;
