import { useAddEvents } from '@proton/components/containers/calendar/hooks';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';
import { getEventWithCalendarAlarms } from '@proton/shared/lib/calendar/integration/invite';
import { noop } from '@proton/shared/lib/helpers/function';
import { omit } from '@proton/shared/lib/helpers/object';
import { RequireSome } from '@proton/shared/lib/interfaces';
import { ImportedEvent } from '@proton/shared/lib/interfaces/calendar';
import { useCallback, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';
import { useNotifications, useLoading, Button } from '@proton/components';
import { getDisableButtons, InvitationModel, UPDATE_ACTION } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
}

const ExtraEventImportButton = ({ model, setModel }: Props) => {
    const [loading, withLoading] = useLoading();
    const addEvents = useAddEvents();
    const { createNotification } = useNotifications();

    const {
        calendarData,
        invitationIcs: { vevent },
    } = model;

    const veventToSave = calendarData?.calendarSettings
        ? getEventWithCalendarAlarms(vevent, calendarData.calendarSettings)
        : vevent;

    const handleSuccess = useCallback(([{ response, component }]: ImportedEvent[]) => {
        const invitationApiToSave = {
            vevent: component,
            calendarEvent: response.Response.Event,
        };
        createNotification({
            type: 'success',
            text: c('Import ICS file from Mail').t`Calendar event created`,
        });
        setModel({
            ...omit(model, ['error']),
            invitationApi: invitationApiToSave,
            hideSummary: true,
            hideLink: false,
            updateAction: UPDATE_ACTION.NONE,
        });
    }, []);

    const handleError = useCallback(() => {
        createNotification({
            type: 'error',
            text: c('Import ICS file from Mail').t`Creating calendar event failed`,
        });
    }, []);

    const handleAdd = async () => {
        const { calendar, isCalendarDisabled } = calendarData || {};
        if (!calendar || isCalendarDisabled) {
            return noop();
        }
        try {
            const { importedEvents, importErrors } = await addEvents({
                events: [veventToSave],
                calendarID: calendar.ID,
            });
            if (importedEvents.length) {
                handleSuccess(importedEvents);
            }
            if (importErrors.length) {
                handleError();
            }
        } catch {
            handleError();
        }
    };

    const importText = c('Action').t`Add to ${CALENDAR_APP_NAME}`;

    return (
        <Button
            className="mb0-5"
            color="weak"
            onClick={() => withLoading(handleAdd())}
            disabled={getDisableButtons(model)}
            loading={loading}
            title={importText}
        >
            {importText}
        </Button>
    );
};

export default ExtraEventImportButton;
