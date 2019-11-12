import {
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS,
    notificationsToModel
} from '../../../helpers/notifications';
import { DEFAULT_EVENT_DURATION, NOTIFICATION_TYPE, FREQUENCY } from '../../../constants';
import { propertiesToDateTimeModel, propertiesToModel, propertiesToNotificationModel } from './propertiesToModel';
import { c } from 'ttag';
import { isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { isIcalRecurring } from 'proton-shared/lib/calendar/recurring';

export const getState = ({
    title = '',
    description = '',
    location = '',
    type = 'event',
    frequency = FREQUENCY.ONCE,
    isAllDay = false,
    fullDayNotifications = [],
    partDayNotifications = [],
    attendees = [],
    calendarID,
    addressID,
    memberID,
    members = [],
    organizer,
    start,
    end,
    defaultTzid
} = {}) => {
    return {
        calendarID,
        addressID,
        memberID,
        organizer,
        members,
        type,
        isAllDay,
        fullDayNotifications,
        partDayNotifications,
        attendees,
        frequency,
        start,
        end,
        title,
        description,
        location,
        defaultTzid
    };
};

export const getDateTimeState = (utcDate, tzid) => {
    return {
        // These should be local dates since the mini calendar and time input uses that.
        date: new Date(
            utcDate.getUTCFullYear(),
            utcDate.getUTCMonth(),
            utcDate.getUTCDate(),
            utcDate.getUTCHours(),
            utcDate.getUTCMinutes()
        ),
        time: new Date(2000, 0, 1, utcDate.getUTCHours(), utcDate.getUTCMinutes()),
        tzid
    };
};

export const getStartAndEnd = ({
    now = new Date(),
    defaultDuration = 30,
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0)),
    end = new Date(
        Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            start.getUTCDate(),
            start.getUTCHours(),
            start.getUTCMinutes() + defaultDuration
        )
    ),
    tzid
}) => {
    return {
        start: getDateTimeState(start, tzid),
        end: getDateTimeState(end, tzid)
    };
};

export const getExistingEvent = ({ veventComponent, veventValarmComponent, start, end, tzid }) => {
    const isAllDay = isIcalAllDay(veventComponent);
    const isRecurring = isIcalRecurring(veventComponent);

    const newModel = propertiesToModel(veventComponent);
    const newDateTime = propertiesToDateTimeModel(veventComponent, isAllDay, tzid, start, end);

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

export const getEmptyModel = ({
    isAllDay,
    title,
    calendarID,
    CalendarBootstrap,
    Addresses,
    start,
    end,
    color,
    tzid
}) => {
    const { Members = [], CalendarSettings } = CalendarBootstrap;

    // By default takes the first one
    const [Member = {}] = Members;
    const Address = Addresses.find(({ Email }) => Member.Email === Email);
    if (!Address) {
        throw new Error(c('Error').t`Member address not found`);
    }

    const {
        DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
        DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS,
        DefaultEventDuration = DEFAULT_EVENT_DURATION
    } = CalendarSettings;

    const { ID: addressID, Email, DisplayName } = Address;

    return {
        title,
        color,
        isAllDay,
        calendarID,
        memberID: Member.ID,
        addressID,
        ...getStartAndEnd({
            defaultDuration: DefaultEventDuration,
            start,
            end,
            tzid
        }),
        defaultPartDayNotification: DEFAULT_PART_DAY_NOTIFICATION,
        defaultFullDayNotification: DEFAULT_FULL_DAY_NOTIFICATION,
        partDayNotifications: notificationsToModel(DefaultPartDayNotifications, false).filter(
            ({ type }) => type === NOTIFICATION_TYPE.DEVICE
        ),
        fullDayNotifications: notificationsToModel(DefaultFullDayNotifications, true).filter(
            ({ type }) => type === NOTIFICATION_TYPE.DEVICE
        ),
        organizer: {
            name: DisplayName,
            email: Email
        },
        members: Members
    };
};
