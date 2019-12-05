import { c } from 'ttag';
import { isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { convertZonedDateTimeToUTC, toUTCDate } from 'proton-shared/lib/date/timezone';
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

export const getDateTimeState = (utcDate, tzid) => {
    return {
        // These should be local dates since the mini calendar and time input uses that.
        date: new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), 0, 0),
        time: new Date(2000, 0, 1, utcDate.getUTCHours(), utcDate.getUTCMinutes()),
        tzid
    };
};

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

export const getInitialDateTimeModel = (defaultEventDuration, tzid) => {
    const now = new Date();

    const start = getSnappedDate(
        new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 30)),
        30
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

export const getInitialModel = ({ CalendarSettings, Calendar, Calendars, Members, Member, Addresses, Address, isAllDay, tzid }) => {
    const { DefaultEventDuration: defaultEventDuration = DEFAULT_EVENT_DURATION } = CalendarSettings;
    const dateTimeModel = getInitialDateTimeModel(defaultEventDuration, tzid);
    const notificationModel = getNotificationModels(CalendarSettings);
    const memberModel = getInitialMemberModel(Addresses, Members, Member, Address);
    const calendarsModel = getCalendarsModel(Calendar, Calendars);

    return {
        title: '',
        location: '',
        description: '',
        frequency: FREQUENCY.ONCE,
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
    const newNotifications = propertiesToNotificationModel(veventValarmComponent, newModel.isAllDay).filter(
        ({ type }) => type === NOTIFICATION_TYPE.DEVICE
    );

    return {
        ...newModel,
        ...newNotifications,
        isAllDay,
        hasMoreOptions: isRecurring || hasDifferingTimezone,
        ...(newModel.isAllDay
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

export const getTimeInUtc = ({ date, time, tzid }) => {
    return toUTCDate(
        convertZonedDateTimeToUTC(
            {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hours: time.getHours(),
                minutes: time.getMinutes()
            },
            tzid
        )
    );
};

export const validate = ({ start, end, title }) => {
    const errors = {};

    const generalProperties = modelToGeneralProperties({ title });

    if (!generalProperties.summary.value) {
        errors.title = c('Error').t`Title required`;
    }

    const utcStart = getTimeInUtc(start);
    const utcEnd = getTimeInUtc(end);

    if (utcStart > utcEnd) {
        errors.end = c('Error').t`Start time must be before end time`;
    }

    return errors;
};

const keys = ['title', 'location', 'description'];

export const hasEditedText = (model, otherModel) => {
    return keys.some((key) => {
        return model[key] !== otherModel[key];
    });
};

export const hasEditedDateTime = ({ time, date }, { time: otherTime, date: otherDate }) => {
    return time.getHours() !== otherTime.getHours() || time.getMinutes() !== otherTime.getMinutes() || !isSameDay(date, otherDate);
};

export const hasDoneChanges = (model, otherModel, isEditMode) => {
    return hasEditedText(model, otherModel) ||
        isEditMode && (
            hasEditedDateTime(model.start, otherModel.start) ||
            hasEditedDateTime(model.end, otherModel.end)
        );
};
