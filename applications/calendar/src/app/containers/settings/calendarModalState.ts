import { c } from 'ttag';
import { DEFAULT_CALENDAR, DEFAULT_EVENT_DURATION } from '../../constants';
import { LABEL_COLORS } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { Address } from 'proton-shared/lib/interfaces';
import { Calendar, CalendarSettings, SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { DEFAULT_FULL_DAY_NOTIFICATIONS, DEFAULT_PART_DAY_NOTIFICATIONS } from '../../settingsConstants';
import { notificationsToModel } from '../../helpers/notificationsToModel';
import { DEFAULT_FULL_DAY_NOTIFICATION, DEFAULT_PART_DAY_NOTIFICATION } from '../../modelConstants';
import { CalendarErrors, CalendarModel } from '../../interfaces/CalendarModel';
import { modelToNotifications } from '../../helpers/modelToNotifications';

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
    AddressID
}: GetCalendarModelArguments): Partial<CalendarModel> => {
    const {
        DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
        DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS,
        DefaultEventDuration = DEFAULT_EVENT_DURATION
    } = CalendarSettings;

    const partDayNotifications = notificationsToModel(DefaultPartDayNotifications, false);
    const fullDayNotifications = notificationsToModel(DefaultFullDayNotifications, true);

    // Filter out any email notifications because they are currently not supported.
    const devicePartDayNotifications = partDayNotifications.filter(
        ({ type }) => type === SETTINGS_NOTIFICATION_TYPE.DEVICE
    );
    const deviceFullDayNotifications = fullDayNotifications.filter(
        ({ type }) => type === SETTINGS_NOTIFICATION_TYPE.DEVICE
    );

    const emailPartDayNotifications = partDayNotifications.filter(
        ({ type }) => type === SETTINGS_NOTIFICATION_TYPE.EMAIL
    );
    const emailFullDayNotifications = fullDayNotifications.filter(
        ({ type }) => type === SETTINGS_NOTIFICATION_TYPE.EMAIL
    );

    return {
        calendarID: Calendar.ID,
        name: Calendar.Name,
        display: !!Calendar.Display,
        description: Calendar.Description,
        color: (Calendar.Color || '').toLowerCase(),
        addressID: AddressID,
        addressOptions: Addresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email })),
        duration: DefaultEventDuration,
        partDayNotifications: devicePartDayNotifications,
        fullDayNotifications: deviceFullDayNotifications,
        _emailPartDayNotifications: emailPartDayNotifications,
        _emailFullDayNotifications: emailFullDayNotifications
    };
};

export const getDefaultModel = (defaultColor: boolean): CalendarModel => {
    return {
        calendarID: '',
        name: '',
        description: '',
        color: defaultColor ? DEFAULT_CALENDAR.color : LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
        display: true,
        addressID: '',
        addressOptions: [],
        duration: DEFAULT_EVENT_DURATION,
        defaultPartDayNotification: DEFAULT_PART_DAY_NOTIFICATION,
        defaultFullDayNotification: DEFAULT_FULL_DAY_NOTIFICATION,
        partDayNotifications: notificationsToModel(DEFAULT_PART_DAY_NOTIFICATIONS, false),
        fullDayNotifications: notificationsToModel(DEFAULT_FULL_DAY_NOTIFICATIONS, true),
        _emailPartDayNotifications: [],
        _emailFullDayNotifications: []
    };
};

export const validate = ({ name }: CalendarModel): CalendarErrors => {
    const errors = {} as { [key: string]: string };

    if (!name) {
        errors.name = c('Error').t`Name required`;
    }

    return errors;
};

export const getCalendarPayload = (model: CalendarModel) => {
    return {
        Name: model.name,
        Color: model.color,
        Display: +model.display,
        Description: model.description
    };
};

export const getCalendarSettingsPayload = (model: CalendarModel) => {
    const {
        duration,
        fullDayNotifications,
        partDayNotifications,
        _emailPartDayNotifications = [],
        _emailFullDayNotifications = []
    } = model;

    return {
        DefaultEventDuration: +duration,
        DefaultFullDayNotifications: modelToNotifications(fullDayNotifications.concat(_emailFullDayNotifications)),
        DefaultPartDayNotifications: modelToNotifications(partDayNotifications.concat(_emailPartDayNotifications))
    };
};
