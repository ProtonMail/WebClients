import { SimpleMap } from '@proton/shared/lib/interfaces';

export enum TelemetryMeasurementGroups {
    mailSimpleLogin = 'mail.web.simplelogin_popups',
    screenSize = 'any.web.screen_size',
    calendarTimeZoneSelector = 'calendar.web.timezone_selector',
    accountSignupBasic = 'account.any.signup_basic',
    accountSignup = 'account.any.signup',
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

export enum TelemetryAccountSignupEvents {
    pageLoad = 'fe.load_signup',
    selectPlan = 'user.plan_select',
    selectCycle = 'user.cycle_select',
    selectCurrency = 'user.currency_select',
    interactAccountCreate = 'user.interact.accountCreate',
    interactRecoveryKit = 'user.interact.recovery_kit',
    interactDownload = 'user.interact.download',
    onboardFinish = 'user.onboard_finish',
    onboardShown = 'user.onboarding_shown',
    beAvailableExternal = 'be.availableExternal',
    userCheckout = 'user.checkout',
    userSignIn = 'user.sign_in',
    userSignInSuccess = 'user.sign_in_success',
    bePaymentMethods = 'be.payment_available',
    paymentSelect = 'user.payment_select',
    interactCreditCard = 'user.interact.credit_card',
    checkoutError = 'be.checkout_error',
    loadPaymentBtc = 'fe.load_payment_btc',
    onboardingStart = 'fe.onboarding_start',
    signupFinish = 'fe.signup_finish',
}

export type TelemetryEvents =
    | TelemetrySimpleLoginEvents
    | TelemetryScreenSizeEvents
    | TelemetryCalendarEvents
    | TelemetryAccountSignupBasicEvents
    | TelemetryAccountSignupEvents;

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
