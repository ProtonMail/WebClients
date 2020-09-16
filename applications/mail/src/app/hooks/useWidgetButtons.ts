import { c } from 'ttag';
import { useCallback } from 'react';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { getProdId } from 'proton-shared/lib/calendar/vcalHelper';
import { wait } from 'proton-shared/lib/helpers/promise';
import { ProtonConfig } from 'proton-shared/lib/interfaces';
import { useApi, useNotifications } from 'react-components';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../helpers/calendar/EventInvitationError';
import { getParticipantHasAddressID, Participant } from '../helpers/calendar/invite';
import { createCalendarEventFromInvitation } from '../helpers/calendar/inviteReply';
import { EVENT_TIME_STATUS, EventInvitation, getEventTimeStatus, InvitationModel } from '../helpers/calendar/invite';
import { createReplyIcs } from '../helpers/calendar/inviteReply';
import { formatSubject, RE_PREFIX } from '../helpers/message/messageDraft';
import { MessageExtended } from '../models/message';
import { RequireSome } from '../models/utils';
import useSendIcs from './useSendIcs';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    message: MessageExtended;
    config: ProtonConfig;
    onSuccess: (invitationApi: RequireSome<EventInvitation, 'calendarEvent'>) => void;
    onCreateEventError: (partstat: ICAL_ATTENDEE_STATUS) => void;
    onPastEvent: (timeStatus: EVENT_TIME_STATUS) => void;
    onUnexpectedError: () => void;
}
const useWidgetButtons = ({
    model,
    message,
    config,
    onUnexpectedError,
    onSuccess,
    onCreateEventError,
    onPastEvent
}: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const sendIcs = useSendIcs();
    const {
        isOrganizerMode,
        invitationIcs,
        invitationIcs: { attendee, organizer },
        invitationApi,
        calendarData: { calendar } = {}
    } = model;

    const sendEmail = useCallback(
        (attendee: RequireSome<Participant, 'addressID'>, organizer: Participant) => {
            return async (partstat: ICAL_ATTENDEE_STATUS) => {
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
                    createNotification({ type: 'error', text: 'Answering invitation has failed. Try again' });
                    return;
                }
            };
        },
        [config, invitationIcs, message]
    );

    const createCalendarEvent = useCallback(
        (attendee: Participant) => {
            return async (partstat: ICAL_ATTENDEE_STATUS) => {
                try {
                    const { createdEvent, savedVevent, savedVcalAttendee } = await createCalendarEventFromInvitation({
                        partstat,
                        model,
                        api
                    });
                    const invitationToSave = {
                        vevent: savedVevent,
                        calendarEvent: createdEvent,
                        attendee: {
                            ...attendee,
                            vcalComponent: savedVcalAttendee,
                            partstat
                        },
                        timeStatus: EVENT_TIME_STATUS.FUTURE
                    };
                    onSuccess(invitationToSave);
                } catch (error) {
                    if (
                        error instanceof EventInvitationError &&
                        error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR
                    ) {
                        onUnexpectedError();
                        return;
                    }
                    onCreateEventError(partstat);
                }
            };
        },
        [model, api]
    );

    const answerInvitation = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
            // Send the corresponding email
            if (!attendee || !getParticipantHasAddressID(attendee) || !organizer || !calendar) {
                onUnexpectedError();
                return;
            }
            const timeStatus = getEventTimeStatus(invitationIcs.vevent, Date.now());
            if (timeStatus !== EVENT_TIME_STATUS.FUTURE) {
                onPastEvent(timeStatus);
                createNotification({ type: 'error', text: c('Info').t`Cannot answer past event` });
                return;
            }
            await sendEmail(attendee, organizer)(partstat);
            await createCalendarEvent(attendee)(partstat);
        },
        [sendEmail, sendIcs]
    );

    const dummyButtons = {
        accept: () => wait(0),
        acceptTentatively: () => wait(0),
        decline: () => wait(0),
        retryCreateEvent: () => wait(0)
    };

    if (!attendee) {
        return dummyButtons;
    }

    if (!isOrganizerMode) {
        if (!invitationApi) {
            return {
                accept: () => answerInvitation(ICAL_ATTENDEE_STATUS.ACCEPTED),
                acceptTentatively: () => answerInvitation(ICAL_ATTENDEE_STATUS.TENTATIVE),
                decline: () => answerInvitation(ICAL_ATTENDEE_STATUS.DECLINED),
                retryCreateEvent: createCalendarEvent(attendee)
            };
        }
    }

    return dummyButtons;
};

export default useWidgetButtons;
