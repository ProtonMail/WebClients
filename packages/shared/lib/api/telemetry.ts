import { SimpleMap } from '@proton/shared/lib/interfaces';

export enum TelemetryMeasurementGroups {
    accountSignup = 'account.any.signup',
    accountSignupBasic = 'account.any.signup_basic',
    calendarEncryptedSearch = 'calendar.web.encrypted_search',
    calendarIcsSurgery = 'calendar.web.ics_surgery',
    calendarTimeZoneSelector = 'calendar.web.timezone_selector',
    keyTransparency = 'any.web.key_transparency',
    mailPrivacyDropdown = 'mail.web.privacy_dropdown',
    mailSelectAll = 'mail.web.select_all',
    mailSimpleLogin = 'mail.web.simplelogin_popups',
}

export enum TelemetrySimpleLoginEvents {
    spam_view = 'spam_view',
    newsletter_unsubscribe = 'newsletter_unsubscribe',
    simplelogin_modal_view = 'simplelogin_modal_view',
    go_to_simplelogin = 'go_to_simplelogin',
}

export enum TelemetryCalendarEvents {
    change_temporary_time_zone = 'change_temporary_time_zone',
    enable_encrypted_search = 'enable_encrypted_search',
}

export enum TelemetryIcsSurgeryEvents {
    import = 'import',
    invitation = 'invitation',
}

export enum TelemetryAccountSignupBasicEvents {
    flow_started = 'flow_started',
    account_created = 'account_created',
}

export enum TelemetryAccountSignupEvents {
    pageLoad = 'fe.page_load',
    planSelect = 'user.plan_select',
    cycleSelect = 'user.cycle_select',
    currencySelect = 'user.currency_select',
    paymentSelect = 'user.payment_select',
    userCheckout = 'user.checkout',
    userSignIn = 'user.sign_in',
    interactAccountCreate = 'user.interact.account_create',
    interactUpsell = 'user.interact.upsell',
    interactCreditCard = 'user.interact.credit_card',
    interactPassword = 'user.interact.password',
    interactRecoveryKit = 'user.interact.recovery',
    interactDownload = 'user.interact.download',
    beAvailableExternal = 'be.available_external',
    beSignInSuccess = 'be.sign_in_success',
    beSignOutSuccess = 'be.sign_out_success',
    bePaymentMethods = 'be.payments_available',
    checkoutError = 'be.checkout_error',
    hvNeeded = 'be.hv_needed',
    loadPaymentBtc = 'fe.load_payment_btc',
    onboardingStart = 'fe.onboarding_start',
    onboardShown = 'fe.onboarding_shown',
    onboardFinish = 'fe.onboarding_finish',
    signupFinish = 'fe.signup_finish',
}

export enum TelemetryKeyTransparencyErrorEvents {
    self_audit_error = 'self_audit_error',
    key_verification_failure = 'key_verification_failure',
}

export enum TelemetryMailEvents {
    privacy_dropdown_opened = 'privacy_dropdown_opened',
}

export enum TelemetryMailSelectAllEvents {
    notification_move_to = 'notification_move_to',
    // The rest will be used soon with the new Select all feature
    banner_move_to = 'banner_move_to',
    banner_label_as = 'banner_label_as',
    banner_mark_as_read = 'banner_mark_as_read',
    banner_mark_as_unread = 'banner_mark_as_unread',
}

export type TelemetryEvents =
    | TelemetrySimpleLoginEvents
    | TelemetryCalendarEvents
    | TelemetryIcsSurgeryEvents
    | TelemetryAccountSignupBasicEvents
    | TelemetryAccountSignupEvents
    | TelemetryKeyTransparencyErrorEvents
    | TelemetryMailEvents
    | TelemetryMailSelectAllEvents;

export interface TelemetryReport {
    measurementGroup: TelemetryMeasurementGroups;
    event: TelemetryEvents;
    values?: SimpleMap<number>;
    dimensions?: SimpleMap<string>;
}

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
        Values: data.Values || {},
        Dimensions: data.Dimensions || {},
    },
});

export const sendMultipleTelemetryData = (data: { reports: TelemetryReport[] }) => {
    const EventInfo = data.reports.map(({ measurementGroup, event, values, dimensions }) => ({
        MeasurementGroup: measurementGroup,
        Event: event,
        Values: values || {},
        Dimensions: dimensions || {},
    }));

    return {
        method: 'post',
        url: 'data/v1/stats/multiple',
        data: { EventInfo },
    };
};
