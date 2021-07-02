import { CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';
import { ImportEventError } from '@proton/shared/lib/calendar/icsSurgery/ImportEventError';
import { noop } from '@proton/shared/lib/helpers/function';
import { CalendarWidgetData, ImportedEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import React, { useCallback } from 'react';
import { c } from 'ttag';
import { processInBatches } from '@proton/shared/lib/calendar/import/encryptAndSubmit';
import { Button } from '../../components';
import { useApi, useLoading } from '../../hooks';

interface Props {
    events: VcalVeventComponent[];
    calendarData?: CalendarWidgetData;
    disabled?: boolean;
    onSuccess: (data: ImportedEvent[]) => void;
    onError: (data: ImportEventError[]) => void;
    className?: string;
}

const AddToCalendarButton = ({ events, calendarData, disabled, onSuccess, onError, className }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const { calendar, isCalendarDisabled, calendarKeys, memberID, addressKeys } = calendarData || {};

    const handleAdd = useCallback(async () => {
        if (!calendar || isCalendarDisabled || !calendarKeys || !memberID || !addressKeys) {
            return noop();
        }
        const { importedEvents, importErrors } = await processInBatches({
            events,
            api,
            memberID,
            addressKeys,
            calendarID: calendar.ID,
            calendarKeys,
        });
        if (importedEvents.length) {
            onSuccess(importedEvents);
        }
        if (importErrors.length) {
            onError(importErrors);
        }
    }, [events, api, calendar, memberID, addressKeys, calendar]);

    const importText = c('Action').t`Add to ${CALENDAR_APP_NAME}`;

    return (
        <Button
            className={className}
            color="weak"
            onClick={() => withLoading(handleAdd())}
            disabled={disabled}
            loading={loading}
            title={importText}
        >
            {importText}
        </Button>
    );
};

export default AddToCalendarButton;
