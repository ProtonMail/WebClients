import { useCallback } from 'react';

import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useApi, useConfig, useRelocalizeText } from '@proton/components';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { useGetVtimezonesMap } from '@proton/components/hooks/useGetVtimezonesMap';
import useSendIcs from '@proton/components/hooks/useSendIcs';
import { serverTime } from '@proton/crypto';
import { withPartstat } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getInviteLocale } from '@proton/shared/lib/calendar/getSettings';
import {
    createInviteIcs,
    generateEmailBody,
    generateVtimezonesComponents,
    getParticipantHasAddressID,
} from '@proton/shared/lib/calendar/mailIntegration/invite';
import { reencryptCalendarSharedEvent } from '@proton/shared/lib/calendar/sync/reencrypt';
import { prodId } from '@proton/shared/lib/calendar/vcalConfig';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { SECOND } from '@proton/shared/lib/constants';
import { omit } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import type {
    CalendarEvent,
    CalendarEventEncryptionData,
    CalendarWidgetData,
    Participant,
    PartstatActions,
    PmInviteData,
    SavedInviteData,
} from '@proton/shared/lib/interfaces/calendar';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { getHasFullCalendarData } from '../helpers/calendar/invite';
import {
    createCalendarEventFromInvitation,
    deleteCalendarEventFromInvitation,
    updatePartstatFromInvitation,
} from '../helpers/calendar/inviteApi';
import { useContactsMap } from './contact/useContacts';

interface Args {
    veventApi?: VcalVeventComponent;
    veventIcs: VcalVeventComponent;
    attendee?: Participant;
    organizer?: Participant;
    subject: string;
    messageID?: string;
    calendarData?: CalendarWidgetData;
    pmData?: PmInviteData;
    singleEditData?: CalendarEvent[];
    reencryptionData?: Required<Pick<CalendarEventEncryptionData, 'encryptingAddressID' | 'sharedSessionKey'>>;
    calendarEvent?: CalendarEvent;
    onEmailSuccess: () => void;
    onEmailError: (error: Error) => void;
    onCreateEventSuccess: () => void;
    onUpdateEventSuccess: () => void;
    onCreateEventError: (partstat: ICAL_ATTENDEE_STATUS, isProtonInvite: boolean, error?: any) => void;
    onUpdateEventError: (
        partstat: ICAL_ATTENDEE_STATUS,
        timestamp: number,
        isProtonInvite: boolean,
        error?: any
    ) => void;
    onReencryptEventError: (error: Error) => void;
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
    reencryptionData,
    calendarEvent,
    onEmailSuccess,
    onEmailError,
    onCreateEventSuccess,
    onUpdateEventSuccess,
    onSuccess,
    onCreateEventError,
    onUpdateEventError,
    onReencryptEventError,
    onUnexpectedError,
    overwrite,
    reinviteEventID,
    disabled = false,
}: Args): PartstatActions => {
    const api = useApi();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const sendIcs = useSendIcs();
    const relocalizeText = useRelocalizeText();
    const config = useConfig();
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();
    const getVTimezonesMap = useGetVtimezonesMap();
    const contactEmailsMap = useContactsMap();

    // Returns true if the operation is succesful
    const sendReplyEmail = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS, timestamp: number) => {
            if (!attendee || !getParticipantHasAddressID(attendee) || !organizer || !config) {
                onUnexpectedError();
                return false;
            }
            try {
                const attendeeWithPartstat = withPartstat(attendee.vcalComponent, partstat);
                const vevent = withDtstamp(omit(veventIcs, ['dtstamp']), timestamp);
                const vtimezones = await generateVtimezonesComponents(vevent, getVTimezonesMap);
                if (pmData?.sharedEventID && pmData?.sharedSessionKey) {
                    vevent['x-pm-proton-reply'] = { value: 'true', parameters: { type: 'boolean' } };
                }
                const ics = createInviteIcs({
                    method: ICAL_METHOD.REPLY,
                    prodId,
                    vevent: withDtstamp(omit(vevent, ['dtstamp']), timestamp),
                    vtimezones,
                    attendeesTo: [attendeeWithPartstat],
                    keepDtstamp: true,
                });
                const inviteLocale = getInviteLocale(await getCalendarUserSettings());
                const getEmailBody = () =>
                    generateEmailBody({
                        method: ICAL_METHOD.REPLY,
                        vevent,
                        emailAddress: attendee.emailAddress,
                        partstat,
                    });
                await sendIcs({
                    method: ICAL_METHOD.REPLY,
                    ics,
                    addressID: attendee.addressID,
                    parentID: messageID,
                    from: { Address: attendee.emailAddress, Name: attendee.name || attendee.emailAddress },
                    to: [{ Address: organizer.emailAddress, Name: organizer.name }],
                    subject,
                    plainTextBody: await relocalizeText({
                        getLocalizedText: getEmailBody,
                        newLocaleCode: inviteLocale,
                        relocalizeDateFormat: true,
                    }),
                    contactEmailsMap,
                });
                onEmailSuccess();
                return true;
            } catch (error: any) {
                onEmailError(error);
                return false;
            }
        },
        [veventApi, veventIcs, attendee, organizer, config, onEmailSuccess, onEmailError]
    );

    // Returns true if the operation is successful
    const deleteCalendarEvent = useCallback(
        async (reinviteEventID: string) => {
            if (!getHasFullCalendarData(calendarData)) {
                onUnexpectedError();
                return false;
            }
            try {
                await deleteCalendarEventFromInvitation({ calendarEventID: reinviteEventID, calendarData, api });
                return true;
            } catch (error: any) {
                onUnexpectedError();
                return false;
            }
        },
        [veventApi, veventIcs, attendee, api, calendarData]
    );

    const createCalendarEvent = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS, isProtonInvite: boolean) => {
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
                onCreateEventError(partstat, isProtonInvite, error);
            }
        },
        [veventIcs, attendee, api, getCanonicalEmailsMap, calendarData, pmData, overwrite]
    );

    const updateCalendarEvent = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS, timestamp: number, isProtonInvite: boolean, event?: CalendarEvent) => {
            if (!attendee || !veventApi || !event) {
                onUnexpectedError();
                return;
            }
            try {
                const { savedEvent, savedVevent, savedVcalAttendee } = await updatePartstatFromInvitation({
                    veventIcs,
                    veventApi,
                    calendarEvent: event,
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
            } catch (error: any) {
                onUpdateEventError(partstat, timestamp, isProtonInvite, error);
            }
        },
        [veventApi, veventIcs, attendee, api, calendarData, singleEditData]
    );

    const answerInvitation = useCallback(
        async (partstat: ICAL_ATTENDEE_STATUS) => {
            let maybeReencryptedEvent: CalendarEvent | undefined = calendarEvent ? { ...calendarEvent } : undefined;
            if (reencryptionData) {
                const { sharedSessionKey } = reencryptionData;
                const { calendarKeys } = calendarData || {};

                if (!calendarKeys || !calendarEvent) {
                    throw new Error('Missing data for re-encrypting event');
                }

                const silentApi = <T>(config: any) =>
                    api<T>({
                        ...config,
                        silence: true,
                    });

                try {
                    maybeReencryptedEvent = await reencryptCalendarSharedEvent({
                        calendarEvent,
                        sharedSessionKey,
                        calendarKeys,
                        api: silentApi,
                    });
                } catch (error: any) {
                    onReencryptEventError(error);
                    return;
                }
            }

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
                        ? await createCalendarEvent(partstat, true)
                        : await updateCalendarEvent(partstat, currentTimestamp, true, maybeReencryptedEvent);
                if (!result) {
                    return;
                }
                const updateTime = result.savedEvent.Attendees.find(
                    ({ Token }) => Token === attendee?.token
                )?.UpdateTime;
                if (!updateTime) {
                    throw new Error('Failed to retrieve attendee update time');
                }
                await sendReplyEmail(partstat, updateTime * SECOND);
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
                    ? await createCalendarEvent(partstat, false)
                    : await updateCalendarEvent(partstat, currentTimestamp, false, maybeReencryptedEvent);
            if (result) {
                onSuccess(result);
            }
        },
        [sendReplyEmail, createCalendarEvent, updateCalendarEvent, reinviteEventID, pmData, reencryptionData]
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
        retryCreateEvent: async ({
            partstat,
            isProtonInvite,
        }: {
            partstat: ICAL_ATTENDEE_STATUS;
            isProtonInvite: boolean;
        }) => {
            const result = await createCalendarEvent(partstat, isProtonInvite);
            if (result) {
                onSuccess(result);
            }
        },
        retryUpdateEvent: async ({
            partstat,
            timestamp,
            isProtonInvite,
            calendarEvent,
        }: {
            partstat: ICAL_ATTENDEE_STATUS;
            timestamp: number;
            isProtonInvite: boolean;
            calendarEvent?: CalendarEvent;
        }) => {
            const result = await updateCalendarEvent(partstat, timestamp, isProtonInvite, calendarEvent);
            if (result) {
                onSuccess(result);
            }
        },
    };
};

export default useInviteButtons;
