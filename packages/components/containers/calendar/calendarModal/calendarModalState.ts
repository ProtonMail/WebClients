import { c } from 'ttag';

import { sortNotificationsByAscendingTrigger } from '@proton/shared/lib/calendar/alarms';
import { modelToNotifications } from '@proton/shared/lib/calendar/alarms/modelToNotifications';
import {
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS,
} from '@proton/shared/lib/calendar/alarms/notificationDefaults';
import { notificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import { CALENDAR_TYPE, DEFAULT_EVENT_DURATION } from '@proton/shared/lib/calendar/constants';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { Address } from '@proton/shared/lib/interfaces';
import {
    CalendarErrors,
    CalendarSettings,
    CalendarViewModelFull,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { CalendarCreateData } from '@proton/shared/lib/interfaces/calendar/Api';

export const getCalendarEventSettingsModel = (settings: Partial<CalendarSettings>) => {
    const {
        DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
        DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS,
        DefaultEventDuration = DEFAULT_EVENT_DURATION,
    } = settings;

    const partDayNotifications = sortNotificationsByAscendingTrigger(
        notificationsToModel(DefaultPartDayNotifications, false)
    );
    const fullDayNotifications = sortNotificationsByAscendingTrigger(
        notificationsToModel(DefaultFullDayNotifications, true)
    );

    return {
        duration: DefaultEventDuration,
        partDayNotifications,
        fullDayNotifications,
    };
};

interface GetCalendarModelArguments {
    Calendar: VisualCalendar;
    CalendarSettings: CalendarSettings;
    Addresses: Address[];
    AddressID: string;
}
export const getCalendarModel = ({
    Calendar,
    CalendarSettings,
    Addresses,
    AddressID,
}: GetCalendarModelArguments): Partial<CalendarViewModelFull> => ({
    calendarID: Calendar.ID,
    name: Calendar.Name,
    display: !!Calendar.Display,
    description: Calendar.Description,
    color: (Calendar.Color || '').toLowerCase(),
    addressID: AddressID,
    addressOptions: Addresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email })),
    type: Calendar.Type,
    ...getCalendarEventSettingsModel(CalendarSettings),
});

export const getDefaultModel = (): CalendarViewModelFull => {
    return {
        calendarID: '',
        name: '',
        members: [],
        description: '',
        color: getRandomAccentColor(),
        display: true,
        addressID: '',
        addressOptions: [],
        duration: DEFAULT_EVENT_DURATION,
        defaultPartDayNotification: DEFAULT_PART_DAY_NOTIFICATION,
        defaultFullDayNotification: DEFAULT_FULL_DAY_NOTIFICATION,
        partDayNotifications: notificationsToModel(DEFAULT_PART_DAY_NOTIFICATIONS, false),
        fullDayNotifications: notificationsToModel(DEFAULT_FULL_DAY_NOTIFICATIONS, true),
        type: CALENDAR_TYPE.PERSONAL,
    };
};

export const validate = ({ name }: CalendarViewModelFull): CalendarErrors => {
    const errors = {} as { [key: string]: string };

    if (!name) {
        errors.name = c('Error').t`Name required`;
    }

    return errors;
};

export const getCalendarPayload = (model: CalendarViewModelFull): CalendarCreateData => {
    return {
        Name: model.name,
        Color: model.color,
        Display: model.display ? 1 : 0,
        Description: model.description,
        URL: model.url,
    };
};

export const getCalendarSettingsPayload = (model: CalendarViewModelFull) => {
    const { duration, fullDayNotifications, partDayNotifications } = model;

    return {
        DefaultEventDuration: +duration,
        DefaultFullDayNotifications: modelToNotifications(fullDayNotifications),
        DefaultPartDayNotifications: modelToNotifications(partDayNotifications),
    };
};
