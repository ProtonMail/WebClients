import { isSameDay } from '@proton/shared/lib/date-fns-utc';
import { DateTimeModel, EventModel, NotificationModel } from '@proton/shared/lib/interfaces/calendar';

const keys = ['title', 'location', 'description', 'isAllDay', 'frequency'];

export const getHasEdited = (keys: string[], model: any, otherModel: any) => {
    return keys.some((key) => {
        return model[key] !== otherModel[key];
    });
};

export const getHasEditedTimezone = ({ tzid }: DateTimeModel, { tzid: otherTzid }: DateTimeModel) => {
    return tzid !== otherTzid;
};

const getHasEditedHourMinutes = (a: Date, b: Date) =>
    a.getHours() !== b.getHours() || a.getMinutes() !== b.getMinutes();

export const getHasEditedDateTime = (
    { time, date }: DateTimeModel,
    { time: otherTime, date: otherDate }: DateTimeModel
) => {
    return getHasEditedHourMinutes(time, otherTime) || !isSameDay(date, otherDate);
};

const getHasEditedNotification = (notification: NotificationModel, otherNotification: NotificationModel) => {
    return (
        getHasEdited(['type', 'unit', 'when', 'value'], notification, otherNotification) ||
        (notification.at && otherNotification.at && getHasEditedHourMinutes(notification.at, otherNotification.at))
    );
};

export const getHasEditedNotifications = (
    notifications: NotificationModel[],
    otherNotifications: NotificationModel[]
) => {
    return (
        notifications.length !== otherNotifications.length ||
        notifications.some((notification, i) => getHasEditedNotification(notification, otherNotifications[i]))
    );
};

const getNotifications = ({ isAllDay, partDayNotifications, fullDayNotifications }: EventModel) => {
    return isAllDay ? fullDayNotifications : partDayNotifications;
};

export const getHasDoneChanges = (model: EventModel, otherModel: EventModel, isEditMode: boolean) => {
    return (
        getHasEdited(keys, model, otherModel) ||
        getHasEditedNotifications(getNotifications(model), getNotifications(otherModel)) ||
        getHasEditedTimezone(model.start, otherModel.start) ||
        getHasEditedTimezone(model.end, otherModel.end) ||
        (isEditMode &&
            (getHasEditedDateTime(model.start, otherModel.start) || getHasEditedDateTime(model.end, otherModel.end)))
    );
};
