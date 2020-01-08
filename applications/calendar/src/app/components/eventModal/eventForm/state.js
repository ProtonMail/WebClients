import { c } from 'ttag';
import { isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { fromLocalDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { isIcalRecurring } from 'proton-shared/lib/calendar/recurring';

import { getSnappedDate } from '../../calendar/mouseHelpers/dateHelpers';
import {
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS,
    notificationsToModel
} from '../../../helpers/notifications';
import { DEFAULT_EVENT_DURATION, FREQUENCY, NOTIFICATION_TYPE } from '../../../constants';
import { propertiesToDateTimeModel, propertiesToModel, propertiesToNotificationModel } from './propertiesToModel';
import { modelToGeneralProperties } from './modelToProperties';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState, getTimeInUtc } from './time';

export const getNotificationModels = ({
    DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
    DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS
}) => {
    return {
        defaultPartDayNotification: DEFAULT_PART_DAY_NOTIFICATION,
        defaultFullDayNotification: DEFAULT_FULL_DAY_NOTIFICATION,
        partDayNotifications: notificationsToModel(DefaultPartDayNotifications, false).filter(
            ({ type }) => type === NOTIFICATION_TYPE.DEVICE
        ),
        fullDayNotifications: notificationsToModel(DefaultFullDayNotifications, true).filter(
            ({ type }) => type === NOTIFICATION_TYPE.DEVICE
        )
    };
};

export const getInitialDateTimeModel = (initialDate, defaultEventDuration, tzid) => {
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
        end: getDateTimeState(end, tzid)
    };
};

export const getInitialMemberModel = (Addresses, Members, Member, Address) => {
    const { ID: addressID } = Address;
    const { ID: memberID } = Member;
    return {
        member: {
            addressID,
            memberID
        }
    };
};

const getCalendarsModel = (Calendar, Calendars = []) => {
    if (!Calendars.some(({ ID }) => ID === Calendar.ID)) {
        throw new Error('Calendar not found');
    }
    return {
        calendars: Calendars.map(({ ID, Name, Color }) => ({ text: Name, value: ID, color: Color })),
        calendar: {
            id: Calendar.ID,
            color: Calendar.Color
        }
    };
};

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
    tzid
}) => {
    const { DefaultEventDuration: defaultEventDuration = DEFAULT_EVENT_DURATION } = CalendarSettings;
    const dateTimeModel = getInitialDateTimeModel(initialDate, defaultEventDuration, tzid);
    const notificationModel = getNotificationModels(CalendarSettings);
    const memberModel = getInitialMemberModel(Addresses, Members, Member, Address);
    const calendarsModel = getCalendarsModel(Calendar, Calendars);

    return {
        title: '',
        location: '',
        description: '',
        frequency: FREQUENCY.ONCE,
        initialDate,
        initialTzid: tzid,
        isAllDay,
        defaultEventDuration,
        ...notificationModel,
        ...memberModel,
        ...dateTimeModel,
        ...calendarsModel
    };
};

export const getExistingEvent = ({ veventComponent, veventValarmComponent, tzid }) => {
    const isAllDay = isIcalAllDay(veventComponent);
    const isRecurring = isIcalRecurring(veventComponent);

    const newModel = propertiesToModel(veventComponent);
    const newDateTime = propertiesToDateTimeModel(veventComponent, isAllDay, tzid);

    const hasDifferingTimezone = newDateTime.start.tzid !== tzid || newDateTime.end.tzid !== tzid;

    // Email notifications are not supported atm.
    const newNotifications = propertiesToNotificationModel(veventValarmComponent, isAllDay).filter(
        ({ type }) => type === NOTIFICATION_TYPE.DEVICE
    );

    return {
        ...newModel,
        isAllDay,
        // TODO: In the latest design we are not using hasMoreOptions, nor the MoreRow component. If the design sticks, we should remove them
        hasMoreOptions: isRecurring || hasDifferingTimezone,
        ...(isAllDay
            ? {
                  fullDayNotifications: newNotifications
              }
            : {
                  partDayNotifications: newNotifications
              }),
        start: newDateTime.start,
        end: newDateTime.end
    };
};

export const addItem = (array, item) => array.concat(item);
export const updateItem = (array, index, newItem) => {
    return array.map((item, i) => {
        if (i !== index) {
            return item;
        }
        return newItem;
    });
};
export const removeItem = (array, index) => array.filter((oldValue, i) => i !== index);

export const validate = ({ start, end, isAllDay, title }) => {
    const errors = {};

    const generalProperties = modelToGeneralProperties({ title });

    if (!generalProperties.summary.value) {
        errors.title = c('Error').t`Title required`;
    }

    const utcStart = getTimeInUtc(start, isAllDay);
    const utcEnd = getTimeInUtc(end, isAllDay);

    if (utcStart > utcEnd) {
        errors.end = c('Error').t`Start time must be before end time`;
    }

    return errors;
};

const keys = ['title', 'location', 'description', 'isAllDay', 'frequency'];

export const hasEdited = (keys, model, otherModel) => {
    return keys.some((key) => {
        return model[key] !== otherModel[key];
    });
};

export const hasEditedTimezone = ({ tzid }, { tzid: otherTzid }) => {
    return tzid !== otherTzid;
};

const hasEditedHourMinutes = (a, b) => a.getHours() !== b.getHours() || a.getMinutes() !== b.getMinutes();

export const hasEditedDateTime = ({ time, date }, { time: otherTime, date: otherDate }) => {
    return hasEditedHourMinutes(time, otherTime) || !isSameDay(date, otherDate);
};

const hasEditedNotification = (notification, otherNotification) => {
    return (
        hasEdited(['type', 'unit', 'when', 'value'], notification, otherNotification) ||
        (notification.at && otherNotification.at && hasEditedHourMinutes(notification.at, otherNotification.at))
    );
};

const hasEditedNotifications = (
    { isAllDay, partDayNotifications, fullDayNotifications },
    { partDayNotifications: otherPartDayNotifications, fullDayNotifications: otherFullDayNotifications }
) => {
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    const otherNotifications = isAllDay ? otherFullDayNotifications : otherPartDayNotifications;

    return (
        notifications.length !== otherNotifications.length ||
        notifications.some((notification, i) => hasEditedNotification(notification, otherNotifications[i]))
    );
};

export const hasDoneChanges = (model, otherModel, isEditMode) => {
    return (
        hasEdited(keys, model, otherModel) ||
        hasEditedNotifications(model, otherModel) ||
        hasEditedTimezone(model.start, otherModel.start) ||
        hasEditedTimezone(model.end, otherModel.end) ||
        (isEditMode &&
            (hasEditedDateTime(model.start, otherModel.start) || hasEditedDateTime(model.end, otherModel.end)))
    );
};
