import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useAddAttendees, useDrawer, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/api';
import { getAttendeeEmail, withPartstat } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { getIsSuccessSyncApiResponse } from '@proton/shared/lib/calendar/helper';
import { AddAttendeeError } from '@proton/shared/lib/calendar/mailIntegration/AddAttendeeError';
import { APPS } from '@proton/shared/lib/constants';
import { postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { omit } from '@proton/shared/lib/helpers/object';
import type { RequireSome } from '@proton/shared/lib/interfaces';
import type { SyncMultipleApiSuccessResponses } from '@proton/shared/lib/interfaces/calendar';
import { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';
import noop from '@proton/utils/noop';

import type { InvitationModel } from '../../../../helpers/calendar/invite';
import { UPDATE_ACTION, getDisableButtons } from '../../../../helpers/calendar/invite';
import { useContactsMap } from '../../../../hooks/contact/useContacts';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs' | 'invitationApi'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
}

const ExtraEventAddParticipantButton = ({ model, setModel }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const contactEmailsMap = useContactsMap();
    const addAttendees = useAddAttendees();
    const { appInView } = useDrawer();

    const {
        calendarData,
        invitationIcs: { attendee: attendeeIcs },
        invitationApi: { vevent: veventApi, calendarEvent, participants: participantsApi = [], organizer },
        isOutdated,
    } = model;

    if (!attendeeIcs || getDisableButtons(model)) {
        // we do not want to display the button in the disabled-scenario cases
        return null;
    }

    const sendInvitation = !!isOutdated;
    const attendeeToSave = sendInvitation
        ? // reset the partstat as we will send a new invitation in this case
          withPartstat(attendeeIcs.vcalComponent, ICAL_ATTENDEE_STATUS.NEEDS_ACTION)
        : attendeeIcs.vcalComponent;
    const veventToSave = {
        ...veventApi,
        attendee: [...(veventApi.attendee || []), attendeeToSave],
    };

    const handleSuccess = (response: SyncMultipleApiSuccessResponses) => {
        const invitationApiToSave = {
            vevent: veventToSave,
            calendarEvent: response.Response.Event,
            attendee: attendeeIcs,
            participants: [...participantsApi, attendeeIcs],
            organizer,
        };
        createNotification({
            type: 'success',
            text: sendInvitation
                ? c('Add participant to calendar event').t`Invitation sent and participant added`
                : c('Add participant to calendar event').t`Participant added`,
        });
        setModel({
            ...omit(model, ['error']),
            invitationApi: invitationApiToSave,
            hideLink: false,
            isPartyCrasher: false,
            updateAction: UPDATE_ACTION.NONE,
        });
    };

    const handleError = (message = '') => {
        createNotification({
            type: 'error',
            text: message || c('Add participant to calendar event').t`Failed to add participant`,
        });
    };

    const handleAdd = async () => {
        if (calendarData?.isCalendarDisabled) {
            return noop();
        }
        try {
            const response = await addAttendees({
                eventComponent: veventToSave,
                calendarEvent,
                addedAttendees: [attendeeToSave],
                sendInvitation,
                contactEmailsMap,
            });
            if (!getIsSuccessSyncApiResponse(response)) {
                return handleError();
            }
            handleSuccess(response);
            // If the calendar app is opened in the drawer,
            // we want to call the calendar event manager to refresh the view
            if (appInView === APPS.PROTONCALENDAR) {
                postMessageToIframe(
                    {
                        type: DRAWER_EVENTS.CALL_CALENDAR_EVENT_MANAGER,
                        payload: { calendarID: calendarEvent.CalendarID },
                    },
                    APPS.PROTONCALENDAR
                );
            }
        } catch (e: any) {
            if (e instanceof EncryptionPreferencesError) {
                const email = getAttendeeEmail(attendeeToSave);
                const errorMessage = reformatApiErrorMessage(e.message);
                return handleError(
                    c('Error sending calendar invitation').t`Cannot send invitation to ${email}. ${errorMessage}`
                );
            }
            if (e instanceof AddAttendeeError) {
                return handleError(e.message);
            }
            handleError();
        }
    };

    const addParticipantText = c('Action').t`Add participant`;

    return (
        <Button
            className="mb-2"
            color="weak"
            onClick={() => withLoading(handleAdd())}
            loading={loading}
            title={addParticipantText}
        >
            {addParticipantText}
        </Button>
    );
};

export default ExtraEventAddParticipantButton;
