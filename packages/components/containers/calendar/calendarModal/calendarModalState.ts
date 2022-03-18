import { c } from 'ttag';
import { LABEL_COLORS } from '@proton/shared/lib/constants';
import { randomIntFromInterval } from '@proton/shared/lib/helpers/function';
import { Address } from '@proton/shared/lib/interfaces';
import {
    Calendar,
    CALENDAR_TYPE,
    CalendarErrors,
    CalendarSettings,
    CalendarViewModelFull,
} from '@proton/shared/lib/interfaces/calendar';
import { CalendarCreateData } from '@proton/shared/lib/interfaces/calendar/Api';
import { modelToNotifications } from '@proton/shared/lib/calendar/modelToNotifications';
import { notificationsToModel } from '@proton/shared/lib/calendar/notificationsToModel';
import { DEFAULT_EVENT_DURATION } from '@proton/shared/lib/calendar/constants';
import {
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS,
} from '@proton/shared/lib/calendar/notificationDefaults';

interface GetCalendarModelArguments {
    Calendar: Calendar;
    CalendarSettings: CalendarSettings;
    Addresses: Address[];
    AddressID: string;
}
export const getCalendarModel = ({
    Calendar,
    CalendarSettings,
    Addresses,
    AddressID,
}: GetCalendarModelArguments): Partial<CalendarViewModelFull> => {
    const {
        DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
        DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS,
        DefaultEventDuration = DEFAULT_EVENT_DURATION,
    } = CalendarSettings;

    const partDayNotifications = notificationsToModel(DefaultPartDayNotifications, false);
    const fullDayNotifications = notificationsToModel(DefaultFullDayNotifications, true);

    return {
        calendarID: Calendar.ID,
        name: Calendar.Name,
        display: !!Calendar.Display,
        description: Calendar.Description,
        color: (Calendar.Color || '').toLowerCase(),
        addressID: AddressID,
        addressOptions: Addresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email })),
        duration: DefaultEventDuration,
        partDayNotifications,
        fullDayNotifications,
        type: Calendar.Type,
    };
};

export const getDefaultModel = (): CalendarViewModelFull => {
    return {
        calendarID: '',
        name: '',
        description: '',
        color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
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
