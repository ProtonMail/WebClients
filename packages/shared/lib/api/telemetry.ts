import type { SimpleMap } from '@proton/shared/lib/interfaces';

export enum TelemetryMeasurementGroups {
    accountSignup = 'account.any.signup',
    accountSignupBasic = 'account.any.signup_basic',
    accountOrgLogoUpload = 'account.web.org_logo_upload',
    accountSecurityCheckup = 'account.web.security_checkup',
    calendarEncryptedSearch = 'calendar.web.encrypted_search',
    calendarIcsSurgery = 'calendar.web.ics_surgery',
    calendarTimeZoneSelector = 'calendar.web.timezone_selector',
    accountCancellation = 'account.web.cancellation',
    /** Not only calendar scope because party crasher on mail and drawer */
    calendarInvite = 'any.web.calendar_invite',
    changelogOpened = 'any.changelog_opened',
    keyTransparency = 'any.web.key_transparency',
    subscriptionModal = 'any.web.subscription_modal',
    mailPrivacyDropdown = 'mail.web.privacy_dropdown',
    mailSelectAll = 'mail.web.select_all',
    mailSnooze = 'mail.web.snooze',
    mailSignup = 'mail.web.signup',
    mailComposerAssistant = 'mail.web.composer_assistant',
    mailProtonTips = 'mail.web.proton_tips',
    /** Setting it to any even if mail only ATM. We will expand it to other apps soon */
    securityCenter = 'any.web.security_center',
    paymentsFlow = 'payments.flow',
    /** Drive Web */
    driveWebFeaturePerformance = 'drive.web.feature_performance',
    /** Shared */
    collapsibleLeftSidebar = 'any.web.collapsible_left_sidebar',
}

export enum TelemetrySubscriptionModalEvents {
    initialization = 'initialization',
    payment = 'payment',
}

export enum TelemetryMailTrial2024UpsellModal {
    noThanks = 'no_thanks',
    closeModal = 'close_modal',
    upsell = 'upsell',
}

export enum TelemetryCalendarEvents {
    change_temporary_time_zone = 'change_temporary_time_zone',
    enable_encrypted_search = 'enable_encrypted_search',
    answer_invite = 'answer_invite',
}

export enum TelemetryIcsSurgeryEvents {
    import = 'import',
    import_publish = 'import_publish',
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

export enum TelemtryAccountCancellationEvents {
    startCancellation = 'start_cancellation',
    cancelPage = 'cancel_page',
    cancelModal = 'cancel_modal',
    feedbackModal = 'feedback_modal',
    resubscribeModal = 'resubscribe_modal',
    dashboardReactivate = 'dashboard_reactivate',
}

export enum TelemetryAccountOrganizationLogoUploadEvents {
    processStart = 'process_start',
    processSuccess = 'process_success',
    processFailure = 'process_failure',
}

export enum TelemetryAccountSecurityCheckupEvents {
    pageLoad = 'page_load',

    completeRecoveryMultiple = 'cohort_change.complete_recovery_multiple',
    completeRecoverySingle = 'cohort_change.complete_recovery_single',
    accountRecoveryEnabled = 'cohort_change.account_recovery_enabled',
}

export enum TelemetryKeyTransparencyErrorEvents {
    self_audit_error = 'self_audit_error',
    key_verification_failure = 'key_verification_failure',
}

export enum TelemetryMailEvents {
    privacy_dropdown_opened = 'privacy_dropdown_opened',
    snooze_open_dropdown = 'snooze_open_dropdown',
}

export enum TelemetryMailSelectAllEvents {
    button_move_to_archive = 'button_move_to_archive',
    button_move_to_trash = 'button_move_to_trash',
    banner_move_to = 'banner_move_to',
    banner_label_as = 'banner_label_as',
    banner_mark_as_read = 'banner_mark_as_read',
    banner_mark_as_unread = 'banner_mark_as_unread',
    banner_permanent_delete = 'banner_permanent_delete',
}

export enum TelemetryMailComposerAssistantEvents {
    show_assistant = 'show_assistant',
    free_trial_start = 'free_trial_start',
    download_model = 'download_model',
    use_answer = 'use_answer',
    not_use_answer = 'not_use_answer',
    request_assistant = 'request_assistant',
    assistant_error = 'assistant_error',
    send_message = 'send_message',
    pause_download = 'pause_download',
    load_model = 'load_model',
    unload_model = 'unload_model',
    incompatible_assistant = 'incompatible_assistant',
}

export enum TelemetryChangelog {
    opened = 'opened',
}

export enum TelemetrySecurityCenterEvents {
    account_security_card = 'account_security_card',
    proton_pass_discover_banner = 'proton_pass_discover_banner',
    proton_pass_create_alias = 'proton_pass_create_alias',
    proton_sentinel_toggle = 'proton_sentinel_toggle',
}

export enum TelemetryPaymentsEvents {
    load_payment = 'load_payment',
    payment_attempt = 'payment_attempt',
    payment_success = 'payment_success',
    payment_failure = 'payment_failure',
}

export enum TelemetryDriveWebFeature {
    performance = 'drive_web_feature_performance',
}

export enum TelemetryCollapsibleLeftSidebarEvents {
    toggleLeftSidebar = 'toggle_left_sidebar',
}

export enum TelemetryProtonTipsEvents {
    tipDispayed = 'tip_displayed',
    CTAButtonClicked = 'cta_clicked',
    tipChangeState = 'tip_change_state',
}

export type TelemetryEvents =
    | TelemetrySubscriptionModalEvents
    | TelemetryMailTrial2024UpsellModal
    | TelemetryCalendarEvents
    | TelemetryIcsSurgeryEvents
    | TelemetryAccountSignupBasicEvents
    | TelemetryAccountSignupEvents
    | TelemtryAccountCancellationEvents
    | TelemetryKeyTransparencyErrorEvents
    | TelemetryMailEvents
    | TelemetryMailSelectAllEvents
    | TelemetryMailComposerAssistantEvents
    | TelemetryChangelog
    | TelemetrySecurityCenterEvents
    | TelemetryPaymentsEvents
    | TelemetryAccountOrganizationLogoUploadEvents
    | TelemetryDriveWebFeature
    | TelemetryAccountSecurityCheckupEvents
    | TelemetryCollapsibleLeftSidebarEvents
    | TelemetryProtonTipsEvents;

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
