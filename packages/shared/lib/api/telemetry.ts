import { SimpleMap } from '@proton/shared/lib/interfaces';

export enum TelemetryMeasurementGroups {
    mailSimpleLogin = 'mail.web.simplelogin_popups',
    screenSize = 'any.web.screen_size',
    calendarTimeZoneSelector = 'calendar.web.timezone_selector',
}

export enum TelemetrySimpleLoginEvents {
    spam_view = 'spam_view',
    newsletter_unsubscribe = 'newsletter_unsubscribe',
    simplelogin_modal_view = 'simplelogin_modal_view',
    go_to_simplelogin = 'go_to_simplelogin',
}

export enum TelemetryScreenSizeEvents {
    load = 'load',
    resize = 'resize',
}

export enum TelemetryCalendarEvents {
    change_temporary_time_zone = 'change_temporary_time_zone',
}

export type TelemetryEvents = TelemetrySimpleLoginEvents | TelemetryScreenSizeEvents | TelemetryCalendarEvents;

export const sendTelemetryData = (data: {
    MeasurementGroup: TelemetryMeasurementGroups;
    Event: TelemetryEvents;
    Values?: SimpleMap<number>;
    Dimensions?: SimpleMap<string>;
}) => ({
    method: 'post',
    url: 'data/v1/stats',
    data: {
        ...data,
        Event: data.Event || {},
        Dimensions: data.Dimensions || {},
    },
});
