import { useEffect, useMemo, useState } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { useContactEmailsCache, useGetVerificationPreferences } from '@proton/components';
import { apiNotificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import { toInternalAttendee } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { EVENT_VERIFICATION_STATUS } from '@proton/shared/lib/calendar/constants';
import { getCalendarEventDecryptionKeys } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { getIsAllDay } from '@proton/shared/lib/calendar/veventHelper';
import type { CalendarSettings, EventModelReadView } from '@proton/shared/lib/interfaces/calendar';
import type { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import type { CalendarViewEventData } from '../../containers/calendar/interface';
import { propertiesToModel } from '../eventModal/eventForm/propertiesToModel';
import { propertiesToNotificationModel } from '../eventModal/eventForm/propertiesToNotificationModel';

const DEFAULT_VEVENT: VcalVeventComponent = {
    component: 'vevent',
    uid: { value: '123' },
    dtstart: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    },
    dtend: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    },
    dtstamp: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    },
};

const useReadEvent = (
    targetEventData: CalendarViewEventData,
    tzid: string,
    calendarSettings?: CalendarSettings
): EventModelReadView => {
    const getVerificationPreferences = useGetVerificationPreferences();
    const { contactEmailsMap } = useContactEmailsCache();
    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeys = useGetAddressKeys();
    const [
        { veventComponent = DEFAULT_VEVENT, hasDefaultNotifications, verificationStatus, selfAddressData },
        { IsProtonProtonInvite },
    ] = targetEventData.eventReadResult?.result || [
        {
            veventComponent: DEFAULT_VEVENT,
            hasDefaultNotifications: true,
            verificationStatus: EVENT_VERIFICATION_STATUS.NOT_VERIFIED,
            selfAddressData: { isOrganizer: false, isAttendee: false },
        },
        { IsProtonProtonInvite: 0 },
    ];

    const isAllDay = getIsAllDay(veventComponent);
    const baseModel = useMemo(() => {
        return propertiesToModel({
            veventComponent,
            hasDefaultNotifications,
            verificationStatus,
            selfAddressData,
            isAllDay,
            isProtonProtonInvite: !!IsProtonProtonInvite,
            tzid,
        });
    }, [
        veventComponent,
        hasDefaultNotifications,
        verificationStatus,
        selfAddressData,
        isAllDay,
        IsProtonProtonInvite,
        tzid,
    ]);

    // Initialize with attendees from the base model, ensuring it's a valid array
    // and filter any potentially invalid attendees
    const initialAttendees = (baseModel.attendees || []).filter(
        (attendee) => attendee && attendee.email && attendee.email !== 'undefined'
    );

    const [attendees, setAttendees] = useState(initialAttendees);

    useEffect(() => {
        const mergeAndDecrypt = async () => {
            try {
                const backendAttendees = (targetEventData?.eventData as any)?.AttendeesInfo?.Attendees;
                const eventUID = (targetEventData?.eventData as any)?.UID;
                const originalCalendarEvent = targetEventData?.eventData as CalendarEvent;

                if (!Array.isArray(backendAttendees) || !eventUID || !originalCalendarEvent) {
                    return;
                }

                // Get decryption keys and session keys - this matches InteractiveCalendarView.tsx
                const privateKeys = await getCalendarEventDecryptionKeys({
                    calendarEvent: originalCalendarEvent,
                    getAddressKeys,
                    getCalendarKeys,
                });

                const [sharedSessionKey] = await readSessionKeys({
                    calendarEvent: originalCalendarEvent,
                    privateKeys,
                });

                if (!sharedSessionKey) {
                    return;
                }

                // Convert backend attendees to VcalAttendeeProperty format for processing with toInternalAttendee
                const vcalAttendees = (baseModel.attendees || []).map((attendee: any) => ({
                    value: attendee.email,
                    parameters: {
                        cn: attendee.cn || attendee.email,
                        role: attendee.role,
                        rsvp: attendee.rsvp,
                        partstat: attendee.partstat,
                        'x-pm-token': attendee.token,
                    },
                }));

                // Process attendees with toInternalAttendee
                const processAttendees = async () => {
                    let processedAttendees;

                    if (vcalAttendees.length > 0) {
                        // If we have vcalAttendees from the internal model, use toInternalAttendee to process them
                        processedAttendees = await Promise.all(
                            await toInternalAttendee(
                                { attendee: vcalAttendees },
                                backendAttendees,
                                sharedSessionKey,
                                eventUID,
                                async (attendeeEmail: string) => {
                                    return getVerificationPreferences({
                                        email: attendeeEmail,
                                        contactEmailsMap,
                                    });
                                }
                            )
                        );
                    } else if (backendAttendees.length > 0) {
                        // If we don't have model attendees but have backend attendees,
                        // create vcalAttendees from backend attendees
                        const backendVcalAttendees = backendAttendees.map((att: any) => ({
                            value: `mailto:${att.Email}`,
                            parameters: {
                                'x-pm-token': att.Token,
                                // We'll set these in toInternalAttendee
                            },
                        }));

                        processedAttendees = await Promise.all(
                            await toInternalAttendee(
                                { attendee: backendVcalAttendees },
                                backendAttendees,
                                sharedSessionKey,
                                eventUID,
                                async (attendeeEmail: string) => {
                                    return getVerificationPreferences({
                                        email: attendeeEmail,
                                        contactEmailsMap,
                                    });
                                }
                            )
                        );
                    } else {
                        // This is normal during initial loading, so log as warning instead of error
                        console.warn('[useReadEvent] No attendees to process');
                        return; // No attendees to process
                    }

                    // Convert from VcalAttendeeProperty back to our AttendeeModel format
                    const updatedAttendees = processedAttendees
                        .map((attendee) => {
                            const email = attendee.value.replace('mailto:', '');
                            // Validate email isn't empty or invalid
                            if (!email || email === 'undefined' || email.trim() === '') {
                                console.warn('[useReadEvent] Skipping attendee with invalid email');
                                return null;
                            }
                            return {
                                email,
                                cn: attendee.parameters?.cn || email,
                                role: (attendee.parameters?.role || ICAL_ATTENDEE_ROLE.OPTIONAL) as ICAL_ATTENDEE_ROLE,
                                rsvp: (attendee.parameters?.rsvp || ICAL_ATTENDEE_RSVP.FALSE) as ICAL_ATTENDEE_RSVP,
                                partstat: (attendee.parameters?.partstat ||
                                    ICAL_ATTENDEE_STATUS.NEEDS_ACTION) as ICAL_ATTENDEE_STATUS,
                                token: attendee.parameters?.['x-pm-token'] || '',
                                comment: attendee.parameters?.['x-pm-comment'] || '',
                            };
                        })
                        .filter((attendee) => attendee !== null);

                    setAttendees(updatedAttendees as AttendeeModel[]);
                };

                await processAttendees();
            } catch (e) {
                console.error('[useReadEvent] Error merging/decrypting backend attendees:', e);
            }
        };

        mergeAndDecrypt();
    }, [targetEventData]);

    const notifications =
        hasDefaultNotifications && calendarSettings
            ? apiNotificationsToModel({ notifications: null, isAllDay, calendarSettings })
            : propertiesToNotificationModel(veventComponent, isAllDay);

    return {
        ...baseModel,
        attendees,
        notifications,
        isAllDay,
    };
};

export default useReadEvent;
