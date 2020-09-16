import { c } from 'ttag';
import { CreateCalendarEventSyncData, syncMultipleEvents } from 'proton-shared/lib/api/calendars';
import { withPmAttendees } from 'proton-shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { getProdId } from 'proton-shared/lib/calendar/vcalHelper';
import { API_CODES, HOUR } from 'proton-shared/lib/constants';
import { wait } from 'proton-shared/lib/helpers/promise';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import { SyncMultipleApiResponse } from 'proton-shared/lib/interfaces/calendar';
import { useCallback } from 'react';
import { useApi, useNotifications } from 'react-components';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../helpers/calendar/EventInvitationError';
import {
    EVENT_TIME_STATUS,
    EventInvitation,
    getEventTimeStatus,
    getSupportedAttendee,
    InvitationModel
} from '../helpers/calendar/invite';
import { addAlarms, createReplyIcs } from '../helpers/calendar/inviteReply';
import { formatSubject, RE_PREFIX } from '../helpers/message/messageDraft';
import { MessageExtended } from '../models/message';
import { RequireSome } from '../models/utils';
import useSendIcs from './useSendIcs';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    message: MessageExtended;
    config: ProtonConfig;
    onSuccess: (invitationApi: RequireSome<EventInvitation, 'calendarEvent'>) => void;
    onPastEvent: (timeStatus: EVENT_TIME_STATUS) => void;
    onUnexpectedError: () => void;
}
const useWidgetButtons = ({ model, message, config, onSuccess, onPastEvent, onUnexpectedError }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const sendIcs = useSendIcs();
    const {
        isOrganizerMode,
        invitationIcs,
        invitationApi,
        calendarData: { calendar, memberID, addressKeys, calendarKeys, calendarSettings } = {}
    } = model;

    const answerInvitation = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
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
            const timeStatus = getEventTimeStatus(invitationIcs.vevent, Date.now());
            if (timeStatus !== EVENT_TIME_STATUS.FUTURE) {
                onPastEvent(timeStatus);
                createNotification({ type: 'error', text: c('Info').t`Cannot answer past event` });
                return;
            }
            try {
                const prodId = getProdId(config);
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
                if (
                    error instanceof EventInvitationError &&
                    error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR
                ) {
                    onUnexpectedError();
                    return;
                }
                createNotification({ type: 'error', text: c('Info').t`Answering invitation has failed` });
                return;
            }
            try {
                const { index: attendeeIndex, vcalComponent } = attendee;
                const supportedAttendee = getSupportedAttendee(vcalComponent);
                const vcalAttendeeToSave = {
                    ...supportedAttendee,
                    parameters: {
                        ...supportedAttendee.parameters,
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
                const veventToSaveWithPmAttendees = await withPmAttendees(veventToSave, api);
                const data = await createCalendarEvent({
                    eventComponent: veventToSaveWithPmAttendees,
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
                if (Code !== API_CODES.SINGLE_SUCCESS || !Event) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR);
                }
                const invitationToSave = {
                    vevent: veventToSave,
                    calendarEvent: Event,
                    attendee: {
                        ...attendee,
                        vcalComponent: vcalAttendeeToSave,
                        partstat
                    },
                    timeStatus: EVENT_TIME_STATUS.FUTURE
                };
                onSuccess(invitationToSave);
                createNotification({ type: 'success', text: c('Info').t`Answer sent` });
            } catch (error) {
                if (
                    error instanceof EventInvitationError &&
                    error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR
                ) {
                    onUnexpectedError();
                    return;
                }
                createNotification({ type: 'error', text: c('Info').t`Creating calendar event has failed` });
            }
        },
        [model, message, config, onUnexpectedError, onSuccess]
    );

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
