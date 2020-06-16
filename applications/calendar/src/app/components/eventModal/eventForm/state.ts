import { getRecurrenceId, getIsAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import { fromLocalDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { Address as tsAddress } from 'proton-shared/lib/interfaces';
import {
    Calendar as tsCalendar,
    CalendarSettings as tsCalendarSettings,
    Member as tsMember,
    SETTINGS_NOTIFICATION_TYPE,
} from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

import { getSnappedDate } from '../../calendar/mouseHelpers/dateHelpers';
import { propertiesToModel } from './propertiesToModel';
import { getDateTimeState } from './time';
import {
    DAILY_TYPE,
    DEFAULT_EVENT_DURATION,
    END_TYPE,
    FREQUENCY,
    MONTHLY_TYPE,
    WEEKLY_TYPE,
    YEARLY_TYPE,
} from '../../../constants';
import { DEFAULT_FULL_DAY_NOTIFICATIONS, DEFAULT_PART_DAY_NOTIFICATIONS } from '../../../settingsConstants';
import { DEFAULT_FULL_DAY_NOTIFICATION, DEFAULT_PART_DAY_NOTIFICATION } from '../../../modelConstants';
import { getDeviceNotifications } from './notificationModel';
import { notificationsToModel } from '../../../helpers/notificationsToModel';
import { propertiesToNotificationModel } from './propertiesToNotificationModel';
import { DateTimeModel, EventModel, FrequencyModel } from '../../../interfaces/EventModel';
import { stripAllTags } from '../../../helpers/sanitize';
import getFrequencyModelChange from './getFrequencyModelChange';

export const getNotificationModels = ({
    DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
    DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS,
    hasModifiedNotifications = { partDay: false, fullDay: false },
}) => {
    return {
        defaultPartDayNotification: DEFAULT_PART_DAY_NOTIFICATION,
        defaultFullDayNotification: DEFAULT_FULL_DAY_NOTIFICATION,
        partDayNotifications: getDeviceNotifications(notificationsToModel(DefaultPartDayNotifications, false)),
        fullDayNotifications: getDeviceNotifications(notificationsToModel(DefaultFullDayNotifications, true)),
        hasModifiedNotifications,
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
    Members: tsMember[],
    Member: tsMember,
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

const getCalendarsModel = (Calendar: tsCalendar, Calendars: tsCalendar[] = []) => {
    if (!Calendars.some(({ ID }) => ID === Calendar.ID)) {
        throw new Error('Calendar not found');
    }
    return {
        calendars: Calendars.map(({ ID, Name, Color }) => ({ text: Name, value: ID, color: Color })),
        calendar: {
            id: Calendar.ID,
            color: Calendar.Color,
        },
    };
};

interface GetInitialModelArguments {
    initialDate: Date;
    CalendarSettings: tsCalendarSettings;
    Calendar: tsCalendar;
    Calendars: tsCalendar[];
    Members: tsMember[];
    Member: tsMember;
    Addresses: tsAddress[];
    Address: tsAddress;
    isAllDay: boolean;
    tzid: string;
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
    tzid,
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
        initialDate,
        initialTzid: tzid,
        isAllDay,
        defaultEventDuration,
        frequencyModel,
        ...notificationModel,
        ...memberModel,
        ...dateTimeModel,
        ...calendarsModel,
    };
};

const getParentMerge = (
    veventComponentParentPartial: VcalVeventComponent,
    recurrenceStart: DateTimeModel,
    tzid: string
) => {
    const isAllDay = getIsAllDay(veventComponentParentPartial);
    const parentModel = propertiesToModel(veventComponentParentPartial, isAllDay, tzid);
    const { frequencyModel, start } = parentModel;
    return {
        frequencyModel: getFrequencyModelChange(start, recurrenceStart, frequencyModel),
    };
};

interface GetExistingEventArguments {
    veventComponent: VcalVeventComponent;
    veventValarmComponent?: VcalVeventComponent;
    veventComponentParentPartial?: VcalVeventComponent;
    tzid: string;
}

export const getExistingEvent = ({
    veventComponent,
    veventValarmComponent,
    veventComponentParentPartial,
    tzid,
}: GetExistingEventArguments): Partial<EventModel> => {
    const isAllDay = getIsAllDay(veventComponent);
    const recurrenceId = getRecurrenceId(veventComponent);

    const newModel = propertiesToModel(veventComponent, isAllDay, tzid);
    const strippedDescription = stripAllTags(newModel.description);

    // Email notifications are not supported atm.
    const newNotifications = propertiesToNotificationModel(veventValarmComponent, isAllDay).filter(
        ({ type }) => type === SETTINGS_NOTIFICATION_TYPE.DEVICE
    );

    const parentMerge =
        veventComponentParentPartial && recurrenceId
            ? getParentMerge(veventComponentParentPartial, newModel.start, tzid)
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
