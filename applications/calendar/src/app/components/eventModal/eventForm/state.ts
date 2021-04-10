import {
    DAILY_TYPE,
    END_TYPE,
    FREQUENCY,
    ICAL_EVENT_STATUS,
    MONTHLY_TYPE,
    WEEKLY_TYPE,
    YEARLY_TYPE,
    EVENT_VERIFICATION_STATUS,
    DEFAULT_EVENT_DURATION,
    SETTINGS_NOTIFICATION_TYPE,
} from 'proton-shared/lib/calendar/constants';
import {
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
} from 'proton-shared/lib/calendar/notificationDefaults';

import { getIsAllDay, getRecurrenceId } from 'proton-shared/lib/calendar/vcalHelper';
import { fromLocalDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { Address as tsAddress } from 'proton-shared/lib/interfaces';
import {
    Calendar as tsCalendar,
    CalendarSettings as tsCalendarSettings,
    Member as tsMember,
    SelfAddressData,
    DateTimeModel,
    EventModel,
    FrequencyModel,
} from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

import { getDeviceNotifications } from 'proton-shared/lib/calendar/notificationModel';
import { notificationsToModel } from 'proton-shared/lib/calendar/notificationsToModel';
import { SharedVcalVeventComponent } from '../../../containers/calendar/eventStore/interface';
import { stripAllTags } from '../../../helpers/sanitize';

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
        partDayNotifications: getDeviceNotifications(notificationsToModel(DefaultPartDayNotifications, false)),
        fullDayNotifications: getDeviceNotifications(notificationsToModel(DefaultFullDayNotifications, true)),
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
    verificationStatus?: EVENT_VERIFICATION_STATUS;
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
    verificationStatus = EVENT_VERIFICATION_STATUS.NOT_VERIFIED,
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
        attendees: [],
        initialDate,
        initialTzid: tzid,
        isAllDay,
        verificationStatus,
        isOrganizer: true,
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
    tzid: string
) => {
    const isAllDay = getIsAllDay(veventComponentParentPartial);
    const parentModel = propertiesToModel(
        { veventComponent: veventComponentParentPartial },
        isAllDay,
        isOrganizer,
        tzid
    );
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
    tzid: string;
    selfAddressData?: SelfAddressData;
}

export const getExistingEvent = ({
    veventComponent,
    veventValarmComponent,
    veventComponentParentPartial,
    isOrganizer,
    tzid,
    selfAddressData,
}: GetExistingEventArguments): Partial<EventModel> => {
    const isAllDay = getIsAllDay(veventComponent);
    const recurrenceId = getRecurrenceId(veventComponent);

    const newModel = propertiesToModel({ veventComponent, selfAddressData }, isAllDay, isOrganizer, tzid);
    const strippedDescription = stripAllTags(newModel.description);

    // Email notifications are not supported atm.
    const newNotifications = propertiesToNotificationModel(veventValarmComponent, isAllDay).filter(
        ({ type }) => type === SETTINGS_NOTIFICATION_TYPE.DEVICE
    );

    const parentMerge =
        veventComponentParentPartial && recurrenceId
            ? getParentMerge(veventComponentParentPartial, newModel.start, newModel.isOrganizer, tzid)
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
