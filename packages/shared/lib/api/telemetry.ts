import { SimpleMap } from '@proton/shared/lib/interfaces';

export enum TelemetryMeasurementGroups {
    mailSimpleLogin = 'mail.web.simple_login',
}

export enum TelemetrySimpleLoginEvents {
    spam_view = 'spam_view',
    newsletter_unsubscribe = 'unsubscribe',
    simplelogin_modal_view = 'simplelogin_modal_view',
    go_to_simplelogin = 'go_to_simplelogin',
}

export type TelemetryEvents = TelemetrySimpleLoginEvents;

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
