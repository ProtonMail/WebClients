import {
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS,
} from '@proton/shared/lib/calendar/alarms/notificationDefaults';
import { apiNotificationsToModel, notificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import {
    getIsCalendarWritable,
    getIsOwnedCalendar,
    getIsSubscribedCalendar,
    getIsUnknownCalendar,
} from '@proton/shared/lib/calendar/calendar';
import {
    DAILY_TYPE,
    DEFAULT_EVENT_DURATION,
    END_TYPE,
    EVENT_VERIFICATION_STATUS,
    FREQUENCY,
    ICAL_EVENT_STATUS,
    MONTHLY_TYPE,
    WEEKLY_TYPE,
    YEARLY_TYPE,
} from '@proton/shared/lib/calendar/constants';
import { stripAllTags } from '@proton/shared/lib/calendar/sanitize';
import { getIsAllDay, getRecurrenceId } from '@proton/shared/lib/calendar/veventHelper';
import { fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import type { Address, RequireOnly, Address as tsAddress } from '@proton/shared/lib/interfaces';
import type {
    AttendeeModel,
    CalendarMember,
    CalendarSettings,
    DateTimeModel,
    EventModel,
    FrequencyModel,
    SelfAddressData,
    VisualCalendar,
    CalendarSettings as tsCalendarSettings,
} from '@proton/shared/lib/interfaces/calendar';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import type { SharedVcalVeventComponent } from '../../../containers/calendar/eventStore/interface';
import { getSnappedDate } from '../../calendar/mouseHelpers/dateHelpers';
import getFrequencyModelChange from './getFrequencyModelChange';
import { propertiesToModel } from './propertiesToModel';
import { propertiesToNotificationModel } from './propertiesToNotificationModel';
import { getDateTimeState } from './time';

export const getNotificationModels = ({
    DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
    DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS,
}) => {
    return {
        defaultPartDayNotification: DEFAULT_PART_DAY_NOTIFICATION,
        defaultFullDayNotification: DEFAULT_FULL_DAY_NOTIFICATION,
        partDayNotifications: notificationsToModel(DefaultPartDayNotifications, false),
        fullDayNotifications: notificationsToModel(DefaultFullDayNotifications, true),
    };
};

export const getInitialDateTimeModel = (initialDate: Date, defaultEventDuration: number, tzid: string) => {
    const snapInterval = 30;

    const start = getSnappedDate(
        new Date(
            Date.UTC(
                initialDate.getUTCFullYear(),
                initialDate.getUTCMonth(),
                initialDate.getUTCDate(),
                initialDate.getUTCHours(),
                initialDate.getUTCMinutes() + snapInterval
            )
        ),
        snapInterval
    );

    const end = new Date(
        Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            start.getUTCDate(),
            start.getUTCHours(),
            start.getUTCMinutes() + defaultEventDuration
        )
    );

    return {
        start: getDateTimeState(start, tzid),
        end: getDateTimeState(end, tzid),
    };
};

export const getInitialFrequencyModel = (startDate: Date): FrequencyModel => {
    return {
        type: FREQUENCY.ONCE,
        frequency: FREQUENCY.ONCE,
        interval: 1,
        daily: { type: DAILY_TYPE.ALL_DAYS },
        weekly: { type: WEEKLY_TYPE.ON_DAYS, days: [startDate.getDay()] },
        monthly: { type: MONTHLY_TYPE.ON_MONTH_DAY },
        yearly: { type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY },
        ends: { type: END_TYPE.NEVER, count: 2 },
    };
};

export const getInitialMemberModel = (
    Addresses: tsAddress[],
    Members: CalendarMember[],
    Member: CalendarMember,
    Address: tsAddress
) => {
    const { ID: addressID } = Address;
    const { ID: memberID } = Member;
    return {
        member: {
            addressID,
            memberID,
        },
    };
};

const getCalendarsModel = (Calendar: VisualCalendar, Calendars: VisualCalendar[] = []) => {
    if (!Calendars.some(({ ID }) => ID === Calendar.ID)) {
        throw new Error('Calendar not found');
    }
    return {
        calendars: Calendars.map((calendar) => ({
            text: calendar.Name,
            value: calendar.ID,
            color: calendar.Color,
            permissions: calendar.Permissions,
            isSubscribed: getIsSubscribedCalendar(calendar),
            isOwned: getIsOwnedCalendar(calendar),
            isWritable: getIsCalendarWritable(calendar),
            isUnknown: getIsUnknownCalendar(calendar),
        })),
        calendar: {
            id: Calendar.ID,
            color: Calendar.Color,
            permissions: Calendar.Permissions,
            isSubscribed: getIsSubscribedCalendar(Calendar),
            isOwned: getIsOwnedCalendar(Calendar),
            isWritable: getIsCalendarWritable(Calendar),
            isUnknown: getIsUnknownCalendar(Calendar),
        },
    };
};

export const getOrganizerAndSelfAddressModel = ({
    attendees,
    addressID,
    addresses,
    isAttendee,
}: {
    attendees: AttendeeModel[];
    addressID: string;
    addresses: Address[];
    isAttendee: boolean;
}) => {
    if (!attendees.length || isAttendee) {
        return {};
    }

    const organizerAddress = addresses.find(({ ID }) => ID === addressID);

    if (!organizerAddress) {
        return {};
    }

    return {
        organizer: { email: organizerAddress.Email, cn: organizerAddress.DisplayName },
        selfAddress: organizerAddress,
    };
};

interface GetInitialModelArguments {
    initialDate: Date;
    CalendarSettings: tsCalendarSettings;
    Calendar: VisualCalendar;
    Calendars: VisualCalendar[];
    Members: CalendarMember[];
    Member: CalendarMember;
    Addresses: tsAddress[];
    Address: tsAddress;
    isAllDay: boolean;
    verificationStatus?: EVENT_VERIFICATION_STATUS;
    tzid: string;
    attendees?: AttendeeModel[];
}

export const getInitialModel = ({
    initialDate = toUTCDate(fromLocalDate(new Date())), // Needs to be in fake utc time
    CalendarSettings,
    Calendar,
    Calendars,
    Members,
    Member,
    Addresses,
    Address,
    isAllDay,
    verificationStatus = EVENT_VERIFICATION_STATUS.NOT_VERIFIED,
    tzid,
    attendees = [],
}: GetInitialModelArguments): EventModel => {
    const { DefaultEventDuration: defaultEventDuration = DEFAULT_EVENT_DURATION } = CalendarSettings;
    const dateTimeModel = getInitialDateTimeModel(initialDate, defaultEventDuration, tzid);
    const frequencyModel = getInitialFrequencyModel(dateTimeModel.start.date);
    const notificationModel = getNotificationModels(CalendarSettings);
    const memberModel = getInitialMemberModel(Addresses, Members, Member, Address);
    const calendarsModel = getCalendarsModel(Calendar, Calendars);
    const organizerModel = getOrganizerAndSelfAddressModel({
        attendees,
        addressID: memberModel.member.addressID,
        addresses: Addresses,
        isAttendee: false,
    });

    return {
        type: 'event',
        title: '',
        location: '',
        description: '',
        attendees,
        ...organizerModel,
        initialDate,
        initialTzid: tzid,
        isAllDay,
        verificationStatus,
        isOrganizer: !!attendees.length,
        isAttendee: false,
        isProtonProtonInvite: false,
        hasDefaultNotifications: true,
        status: ICAL_EVENT_STATUS.CONFIRMED,
        defaultEventDuration,
        frequencyModel,
        hasTouchedRrule: false,
        ...notificationModel,
        hasPartDayDefaultNotifications: true,
        hasFullDayDefaultNotifications: true,
        ...memberModel,
        ...dateTimeModel,
        ...calendarsModel,
    };
};

const getParentMerge = ({
    veventComponentParentPartial,
    recurrenceStart,
    hasDefaultNotifications,
    isProtonProtonInvite,
    tzid,
}: {
    veventComponentParentPartial: SharedVcalVeventComponent;
    recurrenceStart: DateTimeModel;
    hasDefaultNotifications: boolean;
    isProtonProtonInvite: boolean;
    tzid: string;
}) => {
    const isAllDay = getIsAllDay(veventComponentParentPartial);
    const parentModel = propertiesToModel({
        veventComponent: veventComponentParentPartial,
        isAllDay,
        hasDefaultNotifications,
        isProtonProtonInvite,
        tzid,
    });
    const { frequencyModel, start } = parentModel;
    return {
        frequencyModel: getFrequencyModelChange(start, recurrenceStart, frequencyModel),
    };
};

interface GetExistingEventArguments {
    veventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    veventComponentParentPartial?: SharedVcalVeventComponent;
    isProtonProtonInvite: boolean;
    tzid: string;
    selfAddressData: SelfAddressData;
    calendarSettings: CalendarSettings;
    color?: string;
}

export const getExistingEvent = ({
    veventComponent,
    hasDefaultNotifications,
    veventComponentParentPartial,
    isProtonProtonInvite,
    tzid,
    selfAddressData,
    calendarSettings,
}: GetExistingEventArguments): RequireOnly<EventModel, 'isAllDay' | 'description'> => {
    const isAllDay = getIsAllDay(veventComponent);
    const recurrenceId = getRecurrenceId(veventComponent);

    const newModel = propertiesToModel({
        veventComponent,
        hasDefaultNotifications,
        selfAddressData,
        isAllDay,
        isProtonProtonInvite,
        tzid,
    });
    const strippedDescription = stripAllTags(newModel.description);

    const notifications = hasDefaultNotifications
        ? apiNotificationsToModel({ notifications: null, isAllDay, calendarSettings })
        : propertiesToNotificationModel(veventComponent, isAllDay);

    const parentMerge =
        veventComponentParentPartial && recurrenceId
            ? getParentMerge({
                  veventComponentParentPartial,
                  recurrenceStart: newModel.start,
                  hasDefaultNotifications,
                  isProtonProtonInvite,
                  tzid,
              })
            : {};

    return {
        ...newModel,
        description: strippedDescription,
        isAllDay,
        ...parentMerge,
        ...(isAllDay
            ? {
                  fullDayNotifications: notifications,
              }
            : {
                  partDayNotifications: notifications,
              }),
    };
};
