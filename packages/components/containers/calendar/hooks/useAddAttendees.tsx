import { syncMultipleEvents as syncMultipleEventsRoute } from '@proton/shared/lib/api/calendars';
import { getAttendeeEmail, withPmAttendees } from '@proton/shared/lib/calendar/attendees';
import { DEFAULT_ATTENDEE_PERMISSIONS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getInviteLocale } from '@proton/shared/lib/calendar/getSettings';
import { ADD_EVENT_ERROR_TYPE, AddAttendeeError } from '@proton/shared/lib/calendar/integration/AddAttendeeError';
import getCreationKeys from '@proton/shared/lib/calendar/integration/getCreationKeys';
import {
    createInviteIcs,
    generateEmailBody,
    generateEmailSubject,
    generateVtimezonesComponents,
    getIcsMessageWithPreferences,
} from '@proton/shared/lib/calendar/integration/invite';
import { createCalendarEvent, getHasSharedEventContent } from '@proton/shared/lib/calendar/serialize';
import { prodId } from '@proton/shared/lib/calendar/vcalConfig';
import { getBase64SharedSessionKey, withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import {
    CalendarEvent,
    SyncMultipleApiResponse,
    VcalAttendeeProperty,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';
import { serverTime } from '@proton/crypto';
import { useCallback } from 'react';
import {
    useAddresses,
    useApi,
    useGetAddressKeys,
    useGetCalendarInfo,
    useGetCalendarUserSettings,
    useGetEncryptionPreferences,
    useGetMailSettings,
    useRelocalizeText,
} from '../../../hooks';
import { useGetCanonicalEmailsMap } from '../../../hooks/useGetCanonicalEmailsMap';
import { useGetVtimezonesMap } from '../../../hooks/useGetVtimezonesMap';
import useSendIcs from '../../../hooks/useSendIcs';

const useAddAttendees = () => {
    const api = useApi();
    const [addresses] = useAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getMailSettings = useGetMailSettings();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getCalendarInfo = useGetCalendarInfo();
    const sendIcs = useSendIcs();
    const relocalizeText = useRelocalizeText();
    const getVTimezonesMap = useGetVtimezonesMap();
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();

    return useCallback(
        async ({
            eventComponent,
            calendarEvent,
            addedAttendees,
            sendInvitation,
            contactEmailsMap,
        }: {
            eventComponent: VcalVeventComponent;
            calendarEvent: CalendarEvent;
            addedAttendees: VcalAttendeeProperty[];
            sendInvitation: boolean;
            contactEmailsMap?: SimpleMap<ContactEmail>;
        }) => {
            if ((eventComponent.attendee?.length || 0) > 100) {
                throw new AddAttendeeError(ADD_EVENT_ERROR_TYPE.TOO_MANY_PARTICIPANTS);
            }
            const { addressID, memberID, calendarKeys, addressKeys } = await getCalendarInfo(calendarEvent.CalendarID);
            const selfAddress = addresses.find(({ ID }) => ID === addressID);
            if (!selfAddress) {
                throw new Error("Cannot add attendees to events you don't organize");
            }
            const formattedAddedAttendees = addedAttendees.map((attendee) => ({
                attendee,
                email: getAttendeeEmail(attendee),
                cn: attendee.parameters?.cn,
            }));
            const pmVevent = await withPmAttendees(eventComponent, getCanonicalEmailsMap);
            if (sendInvitation) {
                // get send preferences for the added attendee email
                const { Sign } = await getMailSettings();
                const sendPreferencesMap: SimpleMap<SendPreferences> = {};
                await Promise.all(
                    formattedAddedAttendees.map(async ({ email }) => {
                        const encryptionPreferences = await getEncryptionPreferences(email, 0, contactEmailsMap);
                        const sendPreferences = getSendPreferences(
                            encryptionPreferences,
                            getIcsMessageWithPreferences(Sign)
                        );
                        if (sendPreferences.error) {
                            // abort operation if we cannot send the email
                            throw sendPreferences.error;
                        }
                    })
                );
                // create ICS to send
                const currentTimestamp = +serverTime();
                const veventWithDtstamp = withDtstamp(omit(pmVevent, ['dtstamp']), currentTimestamp);
                const vtimezones = await generateVtimezonesComponents(pmVevent, getVTimezonesMap);
                const sharedSessionKey = await getBase64SharedSessionKey({
                    calendarEvent,
                    calendarKeys,
                    getAddressKeys,
                });
                if (!sharedSessionKey) {
                    throw new Error('Failed to retrieve shared session key');
                }
                const inviteVevent = {
                    ...veventWithDtstamp,
                    'x-pm-shared-event-id': { value: calendarEvent.SharedEventID },
                    'x-pm-session-key': { value: sharedSessionKey },
                };
                const inviteIcs = createInviteIcs({
                    method: ICAL_METHOD.REQUEST,
                    prodId,
                    vevent: inviteVevent,
                    vtimezones,
                    keepDtstamp: true,
                });
                const inviteLocale = getInviteLocale(await getCalendarUserSettings());
                const params = { method: ICAL_METHOD.REQUEST, vevent: inviteVevent, isCreateEvent: true };
                // send email with ICS attached
                await sendIcs({
                    method: ICAL_METHOD.REQUEST,
                    ics: inviteIcs,
                    addressID: selfAddress.ID,
                    from: { Address: selfAddress.Email, Name: selfAddress.DisplayName || selfAddress.Email },
                    to: formattedAddedAttendees.map(({ email, cn }) => ({ Address: email, Name: cn || email })),
                    subject: await relocalizeText({
                        getLocalizedText: () => generateEmailSubject(params),
                        newLocaleCode: inviteLocale,
                        relocalizeDateFormat: true,
                    }),
                    plainTextBody: await relocalizeText({
                        getLocalizedText: () => generateEmailBody(params),
                        newLocaleCode: inviteLocale,
                        relocalizeDateFormat: true,
                    }),
                    sendPreferencesMap,
                    contactEmailsMap,
                });
            }
            const data = await createCalendarEvent({
                eventComponent: pmVevent,
                isCreateEvent: false,
                isSwitchCalendar: false,
                ...(await getCreationKeys({
                    calendarEvent,
                    newAddressKeys: addressKeys,
                    newCalendarKeys: calendarKeys,
                })),
            });
            if (!getHasSharedEventContent(data)) {
                throw new Error('Missing shared data');
            }
            const result = await api<SyncMultipleApiResponse>({
                ...syncMultipleEventsRoute(calendarEvent.CalendarID, {
                    MemberID: memberID,
                    Events: [
                        {
                            ID: calendarEvent.ID,
                            Event: {
                                Permissions: DEFAULT_ATTENDEE_PERMISSIONS,
                                IsOrganizer: 1,
                                ...data,
                            },
                        },
                    ],
                }),
                silence: true,
            });
            return result.Responses[0];
        },
        []
    );
};

export default useAddAttendees;
