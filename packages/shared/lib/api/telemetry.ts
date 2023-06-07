import { SimpleMap } from '@proton/shared/lib/interfaces';

export enum TelemetryMeasurementGroups {
    mailSimpleLogin = 'mail.web.simplelogin_popups',
    screenSize = 'any.web.screen_size',
    calendarTimeZoneSelector = 'calendar.web.timezone_selector',
    accountSignupBasic = 'account.any.signup_basic',
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

export enum TelemetryAccountSignupBasicEvents {
    flow_started = 'flow_started',
    account_created = 'account_created',
}

export type TelemetryEvents =
    | TelemetrySimpleLoginEvents
    | TelemetryScreenSizeEvents
    | TelemetryCalendarEvents
    | TelemetryAccountSignupBasicEvents;

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
