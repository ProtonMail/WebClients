import { getEventWithCalendarAlarms } from '@proton/shared/lib/calendar/integration/invite';
import { omit } from '@proton/shared/lib/helpers/object';
import { RequireSome } from '@proton/shared/lib/interfaces';
import { ImportedEvent } from '@proton/shared/lib/interfaces/calendar';
import React, { useCallback, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';
import { useNotifications, AddToCalendarButton } from '@proton/components';
import { getDisableButtons, InvitationModel, UPDATE_ACTION } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
}

const ExtraEventImportButton = ({ model, setModel }: Props) => {
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
            type: 'success',
            text: c('Import ICS file from Mail').t`Creating calendar event failed`,
        });
    }, []);

    return (
        <AddToCalendarButton
            events={[veventToSave]}
            calendarData={calendarData}
            disabled={getDisableButtons(model)}
            onSuccess={handleSuccess}
            onError={handleError}
            className="mb0-5"
        />
    );
};

export default ExtraEventImportButton;
