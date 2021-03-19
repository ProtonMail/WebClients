import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import {
    createInviteIcs,
    generateEmailBody,
    getParticipantHasAddressID,
} from 'proton-shared/lib/calendar/integration/invite';
import { getProdId } from 'proton-shared/lib/calendar/vcalHelper';
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
import { useGetCanonicalEmails } from 'react-components/hooks/useGetCanonicalEmails';
import useSendIcs from 'react-components/hooks/useSendIcs';
import { useContactCache } from '../containers/ContactProvider';
import { createCalendarEventFromInvitation, updatePartstatFromInvitation } from '../helpers/calendar/inviteApi';

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
    onUpdateEventError: (partstat: ICAL_ATTENDEE_STATUS, error?: Error) => void;
    onSuccess: (savedData: SavedInviteData) => void;
    onUnexpectedError: () => void;
    overwrite: boolean;
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
    disabled = false,
}: Args): PartstatActions => {
    const api = useApi();
    const sendIcs = useSendIcs();
    const config = useConfig();
    const getCanonicalEmails = useGetCanonicalEmails();
    const { contactsMap: contactEmailsMap } = useContactCache();

    // Returns true if the operation is succesful
    const sendReplyEmail = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
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
                    vevent,
                    attendeesTo: [attendeeWithPartstat],
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
                    getCanonicalEmails,
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
        [veventIcs, attendee, api, calendarData]
    );

    const updateCalendarEvent = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
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
        [veventApi, veventIcs, attendee, api, calendarData, calendarEvent]
    );

    const answerInvitation = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
            const sent = await sendReplyEmail(partstat);
            if (!sent) {
                return;
            }
            const result = !veventApi ? await createCalendarEvent(partstat) : await updateCalendarEvent(partstat);
            if (result) {
                onSuccess(result);
            }
        },
        [sendReplyEmail, createCalendarEvent, updateCalendarEvent]
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
        retryUpdateEvent: async (partstat: ICAL_ATTENDEE_STATUS) => {
            const result = await updateCalendarEvent(partstat);
            if (result) {
                onSuccess(result);
            }
        },
    };
};

export default useInviteButtons;
