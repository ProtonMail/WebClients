import { CreateCalendarEventSyncData, syncMultipleEvents } from 'proton-shared/lib/api/calendars';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { getProdId } from 'proton-shared/lib/calendar/vcalHelper';
import { API_CODES, HOUR } from 'proton-shared/lib/constants';
import { wait } from 'proton-shared/lib/helpers/promise';
import { ProtonConfig, UserSettings } from 'proton-shared/lib/interfaces';
import { SyncMultipleApiResponse } from 'proton-shared/lib/interfaces/calendar';
import { useApi, useNotifications } from 'react-components';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../helpers/calendar/EventInvitationError';
import { EventInvitation, InvitationModel } from '../helpers/calendar/invite';
import { addAlarms, createReplyIcs } from '../helpers/calendar/inviteReply';
import { formatSubject, RE_PREFIX } from '../helpers/message/messageDraft';
import { MessageExtended } from '../models/message';
import { RequireSome } from '../models/utils';
import useSendIcs from './useSendIcs';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    message: MessageExtended;
    config: ProtonConfig;
    userSettings: UserSettings;
    onUnexpectedError: () => void;
    onSuccess: (invitationApi: RequireSome<EventInvitation, 'eventID'>) => void;
}
const useWidgetButtons = ({ model, message, config, userSettings, onUnexpectedError, onSuccess }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const sendIcs = useSendIcs();
    const {
        isOrganizerMode,
        invitationIcs,
        invitationApi,
        calendarData: { calendar, memberID, addressKeys, calendarKeys, calendarSettings } = {}
    } = model;

    const answerInvitation = async (partstat: ICAL_ATTENDEE_STATUS) => {
        // Send the corresponding email
        const { attendee, organizer } = invitationIcs;
        if (
            !attendee?.addressID ||
            !organizer ||
            !calendar ||
            !memberID ||
            !addressKeys ||
            !calendarKeys ||
            !calendarSettings
        ) {
            onUnexpectedError();
            return;
        }
        try {
            const prodId = getProdId(config, userSettings);
            const ics = createReplyIcs({
                invitation: invitationIcs,
                partstat,
                prodId
            });
            await sendIcs({
                ics,
                addressID: attendee.addressID,
                from: { Address: attendee.emailAddress, Name: attendee.displayName || attendee.emailAddress },
                to: [{ Address: organizer.emailAddress, Name: organizer.name }],
                subject: formatSubject(message.data?.Subject, RE_PREFIX)
            });
        } catch (error) {
            if (error instanceof EventInvitationError && error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
                onUnexpectedError();
                return;
            }
            createNotification({ type: 'error', text: 'Answering invitation has failed. Try again' });
        }
        try {
            const { index: attendeeIndex, vcalComponent } = attendee;
            const vcalAttendeeToSave = {
                ...vcalComponent,
                parameters: {
                    ...vcalComponent.parameters,
                    partstat
                }
            };
            const veventToSave =
                partstat === ICAL_ATTENDEE_STATUS.DECLINED
                    ? invitationIcs.vevent
                    : addAlarms(invitationIcs.vevent, calendarSettings);
            if (!veventToSave.attendee || attendeeIndex === undefined || attendeeIndex === -1) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR);
            }
            veventToSave.attendee[attendeeIndex] = vcalAttendeeToSave;
            const data = await createCalendarEvent({
                eventComponent: veventToSave,
                isSwitchCalendar: false,
                ...(await getCreationKeys({ addressKeys, newCalendarKeys: calendarKeys }))
            });
            const Events: CreateCalendarEventSyncData[] = [{ Overwrite: 0, Event: { Permissions: 3, ...data } }];
            const {
                Responses: [
                    {
                        Response: { Code, Event }
                    }
                ]
            } = await api<SyncMultipleApiResponse>({
                ...syncMultipleEvents(calendar.ID, { MemberID: memberID, Events }),
                timeout: HOUR,
                silence: true
            });
            if (Code !== API_CODES.SINGLE_SUCCESS || !Event?.ID) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR);
            }
            const invitationToSave = {
                vevent: veventToSave,
                eventID: Event.ID,
                attendee: {
                    ...attendee,
                    vcalComponent: vcalAttendeeToSave,
                    partstat
                }
            };
            onSuccess(invitationToSave);
        } catch (error) {
            if (error instanceof EventInvitationError && error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
                onUnexpectedError();
                return;
            }
            createNotification({ type: 'error', text: 'Sending email has failed. Try again' });
        }
    };

    if (!isOrganizerMode) {
        if (!invitationApi) {
            return {
                accept: () => answerInvitation(ICAL_ATTENDEE_STATUS.ACCEPTED),
                acceptTentatively: () => answerInvitation(ICAL_ATTENDEE_STATUS.TENTATIVE),
                decline: () => answerInvitation(ICAL_ATTENDEE_STATUS.DECLINED)
            };
        }
    }

    return {
        accept: () => wait(0),
        acceptTentatively: () => wait(0),
        decline: () => wait(0)
    };
};

export default useWidgetButtons;
