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
import {
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS,
} from '@proton/shared/lib/calendar/notificationDefaults';
import { notificationsToModel } from '@proton/shared/lib/calendar/notificationsToModel';
import { stripAllTags } from '@proton/shared/lib/calendar/sanitize';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { getIsAllDay, getRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { Address as tsAddress } from '@proton/shared/lib/interfaces';
import {
    AttendeeModel,
    CalendarMember,
    DateTimeModel,
    EventModel,
    FrequencyModel,
    SelfAddressData,
    VisualCalendar,
    CalendarSettings as tsCalendarSettings,
} from '@proton/shared/lib/interfaces/calendar';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { SharedVcalVeventComponent } from '../../../containers/calendar/eventStore/interface';
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
        frequency: FREQUENCY.WEEKLY,
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
        })),
        calendar: {
            id: Calendar.ID,
            color: Calendar.Color,
            permissions: Calendar.Permissions,
            isSubscribed: getIsSubscribedCalendar(Calendar),
        },
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

    return {
        type: 'event',
        title: '',
        location: '',
        description: '',
        attendees,
        initialDate,
        initialTzid: tzid,
        isAllDay,
        verificationStatus,
        isOrganizer: true,
        isProtonProtonInvite: false,
        status: ICAL_EVENT_STATUS.CONFIRMED,
        defaultEventDuration,
        frequencyModel,
        hasTouchedRrule: false,
        ...notificationModel,
        hasTouchedNotifications: { partDay: false, fullDay: false },
        ...memberModel,
        ...dateTimeModel,
        ...calendarsModel,
    };
};

const getParentMerge = (
    veventComponentParentPartial: SharedVcalVeventComponent,
    recurrenceStart: DateTimeModel,
    isOrganizer: boolean,
    isProtonProtonInvite: boolean,
    tzid: string
) => {
    const isAllDay = getIsAllDay(veventComponentParentPartial);
    const parentModel = propertiesToModel({
        veventComponent: veventComponentParentPartial,
        isAllDay,
        isOrganizer,
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
    veventValarmComponent?: VcalVeventComponent;
    veventComponentParentPartial?: SharedVcalVeventComponent;
    isOrganizer: boolean;
    isProtonProtonInvite: boolean;
    tzid: string;
    selfAddressData?: SelfAddressData;
}

export const getExistingEvent = ({
    veventComponent,
    veventValarmComponent,
    veventComponentParentPartial,
    isOrganizer,
    isProtonProtonInvite,
    tzid,
    selfAddressData,
}: GetExistingEventArguments): Partial<EventModel> => {
    const isAllDay = getIsAllDay(veventComponent);
    const recurrenceId = getRecurrenceId(veventComponent);

    const newModel = propertiesToModel({
        veventComponent,
        selfAddressData,
        isAllDay,
        isOrganizer,
        isProtonProtonInvite,
        tzid,
    });
    const strippedDescription = stripAllTags(newModel.description);

    const newNotifications = propertiesToNotificationModel(veventValarmComponent, isAllDay);

    const parentMerge =
        veventComponentParentPartial && recurrenceId
            ? getParentMerge(
                  veventComponentParentPartial,
                  newModel.start,
                  newModel.isOrganizer,
                  newModel.isProtonProtonInvite,
                  tzid
              )
            : {};

    return {
        ...newModel,
        description: strippedDescription,
        isAllDay,
        ...parentMerge,
        ...(isAllDay
            ? {
                  fullDayNotifications: newNotifications,
              }
            : {
                  partDayNotifications: newNotifications,
              }),
    };
};
