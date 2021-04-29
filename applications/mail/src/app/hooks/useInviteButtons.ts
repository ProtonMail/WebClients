import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import {
    createInviteIcs,
    generateEmailBody,
    getParticipantHasAddressID,
} from 'proton-shared/lib/calendar/integration/invite';
import { getProdId } from 'proton-shared/lib/calendar/vcalHelper';
import { withDtstamp } from 'proton-shared/lib/calendar/veventHelper';
import { SECOND } from 'proton-shared/lib/constants';
import { omit } from 'proton-shared/lib/helpers/object';
import { wait } from 'proton-shared/lib/helpers/promise';
import {
    CalendarEvent,
    CalendarEventWithMetadata,
    CalendarWidgetData,
    Participant,
    PartstatActions,
    PmInviteData,
    SavedInviteData,
} from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { useCallback } from 'react';
import { useApi, useConfig } from 'react-components';
import { useGetCanonicalEmailsMap } from 'react-components/hooks/useGetCanonicalEmailsMap';
import useSendIcs from 'react-components/hooks/useSendIcs';
import { serverTime } from 'pmcrypto';
import { useContactCache } from '../containers/ContactProvider';
import { getHasFullCalendarData } from '../helpers/calendar/invite';
import {
    createCalendarEventFromInvitation,
    deleteCalendarEventFromInvitation,
    updatePartstatFromInvitation,
} from '../helpers/calendar/inviteApi';

interface Args {
    veventApi?: VcalVeventComponent;
    veventIcs: VcalVeventComponent;
    attendee?: Participant;
    organizer?: Participant;
    subject: string;
    messageID?: string;
    calendarData?: CalendarWidgetData;
    pmData?: PmInviteData;
    singleEditData?: CalendarEventWithMetadata[];
    calendarEvent?: CalendarEvent;
    onEmailSuccess: () => void;
    onEmailError: (error: Error) => void;
    onCreateEventSuccess: () => void;
    onUpdateEventSuccess: () => void;
    onCreateEventError: (partstat: ICAL_ATTENDEE_STATUS, error?: Error) => void;
    onUpdateEventError: (partstat: ICAL_ATTENDEE_STATUS, timestamp: number, error?: Error) => void;
    onSuccess: (savedData: SavedInviteData) => void;
    onUnexpectedError: () => void;
    overwrite: boolean;
    reinviteEventID?: string;
    disabled?: boolean;
}
const useInviteButtons = ({
    veventApi,
    veventIcs,
    attendee,
    organizer,
    subject,
    messageID,
    calendarData,
    pmData,
    singleEditData,
    calendarEvent,
    onEmailSuccess,
    onEmailError,
    onCreateEventSuccess,
    onUpdateEventSuccess,
    onSuccess,
    onCreateEventError,
    onUpdateEventError,
    onUnexpectedError,
    overwrite,
    reinviteEventID,
    disabled = false,
}: Args): PartstatActions => {
    const api = useApi();
    const sendIcs = useSendIcs();
    const config = useConfig();
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();
    const { contactsMap: contactEmailsMap } = useContactCache();

    // Returns true if the operation is succesful
    const sendReplyEmail = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS, timestamp: number) => {
            const vevent = veventApi || veventIcs;
            if (!vevent || !attendee || !getParticipantHasAddressID(attendee) || !organizer || !config) {
                onUnexpectedError();
                return false;
            }
            try {
                const prodId = getProdId(config);
                const attendeeWithPartstat = {
                    ...attendee.vcalComponent,
                    parameters: {
                        ...attendee.vcalComponent.parameters,
                        partstat,
                    },
                };
                const ics = createInviteIcs({
                    method: ICAL_METHOD.REPLY,
                    prodId,
                    vevent: withDtstamp(omit(vevent, ['dtstamp']), timestamp),
                    attendeesTo: [attendeeWithPartstat],
                    keepDtstamp: true,
                });
                await sendIcs({
                    method: ICAL_METHOD.REPLY,
                    ics,
                    addressID: attendee.addressID,
                    parentID: messageID,
                    from: { Address: attendee.emailAddress, Name: attendee.name || attendee.emailAddress },
                    to: [{ Address: organizer.emailAddress, Name: organizer.name }],
                    subject,
                    plainTextBody: generateEmailBody({
                        method: ICAL_METHOD.REPLY,
                        vevent,
                        emailAddress: attendee.emailAddress,
                        partstat,
                    }),
                    contactEmailsMap,
                });
                onEmailSuccess();
                return true;
            } catch (error) {
                onEmailError(error);
                return false;
            }
        },
        [veventApi, veventIcs, attendee, organizer, config, onEmailSuccess, onEmailError]
    );

    // Returns true if the operation is succesful
    const deleteCalendarEvent = useCallback(
        async (reinviteEventID: string) => {
            if (!getHasFullCalendarData(calendarData)) {
                onUnexpectedError();
                return false;
            }
            try {
                deleteCalendarEventFromInvitation({ calendarEventID: reinviteEventID, calendarData, api });
                return true;
            } catch (error) {
                onUnexpectedError();
                return false;
            }
        },
        [veventApi, veventIcs, attendee, api, calendarData, calendarEvent]
    );

    const createCalendarEvent = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
            if (!attendee || !veventIcs) {
                onUnexpectedError();
                return;
            }
            try {
                const { savedEvent, savedVevent, savedVcalAttendee } = await createCalendarEventFromInvitation({
                    vevent: veventIcs,
                    vcalAttendee: attendee.vcalComponent,
                    partstat,
                    api,
                    getCanonicalEmailsMap,
                    calendarData,
                    pmData,
                    overwrite,
                });
                onCreateEventSuccess();
                return { savedEvent, savedVevent, savedVcalAttendee };
            } catch (error) {
                onCreateEventError(partstat, error);
            }
        },
        [veventIcs, attendee, api, getCanonicalEmailsMap, calendarData, pmData, overwrite]
    );

    const updateCalendarEvent = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS, timestamp: number) => {
            if (!attendee || !veventApi || !calendarEvent) {
                onUnexpectedError();
                return;
            }
            try {
                const { savedEvent, savedVevent, savedVcalAttendee } = await updatePartstatFromInvitation({
                    veventIcs,
                    veventApi,
                    calendarEvent,
                    vcalAttendee: attendee.vcalComponent,
                    attendeeToken: attendee.token,
                    partstat,
                    oldPartstat: attendee.partstat,
                    timestamp,
                    api,
                    calendarData,
                    singleEditData,
                });
                onUpdateEventSuccess();
                return { savedEvent, savedVevent, savedVcalAttendee };
            } catch (error) {
                onUpdateEventError(partstat, error);
            }
        },
        [veventApi, veventIcs, attendee, api, calendarData, calendarEvent, singleEditData]
    );

    const answerInvitation = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
            if (reinviteEventID) {
                const deleted = await deleteCalendarEvent(reinviteEventID);
                if (!deleted) {
                    return;
                }
            }
            const currentTimestamp = +serverTime();
            if (pmData) {
                // we perform the sync operations before sending the email, as the interaction
                // does not happen via email for Proton-Proton invites
                const result =
                    !veventApi || reinviteEventID
                        ? await createCalendarEvent(partstat)
                        : await updateCalendarEvent(partstat, currentTimestamp);
                if (!result) {
                    return;
                }
                const attendeeApi = result.savedEvent.Attendees.find(({ Token }) => Token === attendee?.token);
                if (!attendeeApi) {
                    throw new Error('Could not retrieve attendee');
                }
                await sendReplyEmail(partstat, attendeeApi.UpdateTime * SECOND);
                onSuccess(result);
                return;
            }
            // For other invites, we perform the sync operations after sending the email;
            // and only if the latter is successful, as the interaction happens via email
            const sent = await sendReplyEmail(partstat, currentTimestamp);
            if (!sent) {
                return;
            }
            const result =
                !veventApi || reinviteEventID
                    ? await createCalendarEvent(partstat)
                    : await updateCalendarEvent(partstat, currentTimestamp);
            if (result) {
                onSuccess(result);
            }
        },
        [sendReplyEmail, createCalendarEvent, updateCalendarEvent, reinviteEventID, pmData]
    );

    const dummyActions = {
        accept: () => wait(0),
        acceptTentatively: () => wait(0),
        decline: () => wait(0),
        retryCreateEvent: () => wait(0),
        retryUpdateEvent: () => wait(0),
    };

    if (!attendee || !organizer || disabled) {
        return dummyActions;
    }

    return {
        accept: () => answerInvitation(ICAL_ATTENDEE_STATUS.ACCEPTED),
        acceptTentatively: () => answerInvitation(ICAL_ATTENDEE_STATUS.TENTATIVE),
        decline: () => answerInvitation(ICAL_ATTENDEE_STATUS.DECLINED),
        retryCreateEvent: async (partstat: ICAL_ATTENDEE_STATUS) => {
            const result = await createCalendarEvent(partstat);
            if (result) {
                onSuccess(result);
            }
        },
        retryUpdateEvent: async (partstat: ICAL_ATTENDEE_STATUS, timestamp: number) => {
            const result = await updateCalendarEvent(partstat, timestamp);
            if (result) {
                onSuccess(result);
            }
        },
    };
};

export default useInviteButtons;
