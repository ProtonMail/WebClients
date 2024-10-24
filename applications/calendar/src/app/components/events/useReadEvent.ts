import { useMemo } from 'react';

import { apiNotificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import { EVENT_VERIFICATION_STATUS } from '@proton/shared/lib/calendar/constants';
import { getIsAllDay } from '@proton/shared/lib/calendar/veventHelper';
import type { CalendarSettings, EventModelReadView } from '@proton/shared/lib/interfaces/calendar';
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
    return useMemo(() => {
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
        const model = propertiesToModel({
            veventComponent,
            hasDefaultNotifications,
            verificationStatus,
            selfAddressData,
            isAllDay,
            isProtonProtonInvite: !!IsProtonProtonInvite,
            tzid,
        });
        const notifications =
            hasDefaultNotifications && calendarSettings
                ? apiNotificationsToModel({ notifications: null, isAllDay, calendarSettings })
                : propertiesToNotificationModel(veventComponent, isAllDay);

        return {
            ...model,
            notifications,
            isAllDay,
        };
    }, [targetEventData, tzid, calendarSettings]);
};

export default useReadEvent;
