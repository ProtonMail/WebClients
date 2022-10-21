import React from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { CALENDAR_TYPE, CALENDAR_TYPE_EXTENDED, EXTENDED_CALENDAR_TYPE } from '@proton/shared/lib/interfaces/calendar';

import { AlertModal } from '../../components/alertModal';
import { SettingsLink } from '../../components/link';

const getText = (type: EXTENDED_CALENDAR_TYPE) => {
    if (type === CALENDAR_TYPE_EXTENDED.SHARED) {
        return c('Modal for limit of calendars reached')
            .t`Unable to add more calendars. You have reached the maximum of personal calendars within your plan.`;
    }
    if (type === CALENDAR_TYPE.SUBSCRIPTION) {
        return c('Modal for limit of calendars reached')
            .t`Unable to add more calendars. You have reached the maximum of subscribed calendars within your plan.`;
    }
    return c('Modal for limit of calendars reached')
        .t`Unable to create more calendars. You have reached the maximum of personal calendars within your plan.`;
};

interface Props {
    onClose?: () => void;
    open?: boolean;
    calendarType: EXTENDED_CALENDAR_TYPE;
}
const CalendarLimitReachedModal = ({ open, onClose, calendarType }: Props) => {
    return (
        <AlertModal
            open={open}
            title={c('Modal title').t`Unable to add more calendars`}
            buttons={[
                <ButtonLike color="norm" as={SettingsLink} path={getCalendarsSettingsPath()}>
                    {c('Modal action').t`Manage calendars`}
                </ButtonLike>,
                <Button onClick={onClose}>{c('Modal action').t`Close`}</Button>,
            ]}
            onClose={onClose}
        >
            {getText(calendarType)}
        </AlertModal>
    );
};

export default CalendarLimitReachedModal;
