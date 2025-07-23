import type { SimpleMap } from '@proton/shared/lib/interfaces';

// Reminder: both auth & un-auth measurement groups need to be whitelisted by the back-end. Make sure to specify it to the back-end or your measurement will be silently ignored.
export enum TelemetryMeasurementGroups {
    accountSignup = 'account.any.signup',
    accountOrgLogoUpload = 'account.web.org_logo_upload',
    accountSecurityCheckup = 'account.web.security_checkup',
    accountDashboard = 'account.web.dashboard',
    calendarEncryptedSearch = 'calendar.web.encrypted_search',
    calendarIcsSurgery = 'calendar.web.ics_surgery',
    calendarTimeZoneSelector = 'calendar.web.timezone_selector',
    calendarVideoConferencing = 'calendar.web.video_conferencing',
    accountCancellation = 'account.web.cancellation',
    settingsHeartBeat = 'any.web.settings_heart_beat',
    calendarSettingsHeartBeat = 'any.web.calendar_settings_heart_beat',
    /** Not only calendar scope because party crasher on mail and drawer */
    calendarInvite = 'any.web.calendar_invite',
    changelogOpened = 'any.changelog_opened',
    keyTransparency = 'any.web.key_transparency',
    subscriptionModal = 'any.web.subscription_modal',
    mailOnboarding = 'mail.web.onboarding',
    paidUsersNudge = 'any.web.paid_users_nudge',
    mailPrivacyDropdown = 'mail.web.privacy_dropdown',
    mailSelectAll = 'mail.web.select_all',
    mailSnooze = 'mail.web.snooze',
    mailSignup = 'mail.web.signup',
    mailComposerAssistant = 'mail.web.composer_assistant',
    mailProtonTips = 'mail.web.proton_tips',
    postSubscriptionTourEvents = 'any.web.post_subscription_tour_events',
    mailDesktopDefaultMailto = 'mail.desktop.default_mailto',
    mailDesktopDailyStats = 'mail.desktop.daily_stats',
    mailActions = 'mail.web.clicks_mail_actions',
    mailPostSignupOneDollar = 'mail.web.post_signup_one_dollar',
    mailPagingControls = 'mail.web.paging_controls',
    passNudge = 'mail.web.pass_nudge',
    mailNewsletterSubscriptions = 'mail.web.newsletter_subscriptions',
    unlimitedOffer2025 = 'any.web.unlimited_offer_2025',
    /** Setting it to any even if mail only ATM. We will expand it to other apps soon */
    securityCenter = 'any.web.security_center',
    vpnDrawer = 'any.web.vpn_drawer',
    paymentsFlow = 'payments.flow',
    /** Drive Web */
    driveWebFeaturePerformance = 'drive.web.feature_performance_unauth',
    driveWebActions = 'drive.web.actions_unauth',
    drivePostSignupOneDollar = 'drive.web.post_signup_one_dollar',
    driveUnlimitedOffer2025 = 'mail.web.unlimited_offer_2025',
    /** Shared */
    collapsibleLeftSidebar = 'any.web.collapsible_left_sidebar',
    smartBanner = 'any.web.smart_banner',
    clientInstalls = 'common.any.client_installs',
    clientSearch = 'any.web.client_search',
    b2bOnboarding = 'any.web.b2b_onboarding',
    /** Docs */
    docsSuggestions = 'common.web.suggestions',
    docsHomepage = 'drive.docs.homepage',
}

export enum TelemetryMailOnboardingEvents {
    start_onboarding_modals = 'start_onboarding_modals',
    finish_onboarding_modals = 'finish_onboarding_modals',
    select_theme = 'select_theme',
    enable_gmail_forwarding = 'enable_gmail_forwarding',
    change_login = 'change_login',
    change_login_checklist = 'change_login_checklist',
    finish_change_login = 'finish_change_login',
    download_desktop_app = 'download_desktop_app',
    premium_features = 'premium_features',
    close_checklist = 'close_checklist',
    clicked_checklist_setting = 'clicked_checklist_setting',
}

export enum TelemetrySubscriptionModalEvents {
    initialization = 'initialization',
    payment = 'payment',
    cancelledOnSameDay = 'cancelled_on_same_day',
}

export enum TelemetryMailTrial2024UpsellModal {
    noThanks = 'no_thanks',
    closeModal = 'close_modal',
    upsell = 'upsell',
}

export enum TelemetryMailPagingControlsEvents {
    move_to_previous_page = 'move_to_previous_page',
    move_to_next_page = 'move_to_next_page',
    clicked_load_more_search_results = 'clicked_load_more_search_results',
    move_to_custom_page = 'move_to_custom_page',
}

export enum TelemetryCalendarEvents {
    change_temporary_time_zone = 'change_temporary_time_zone',
    answer_invite = 'answer_invite',
}

export enum TelemetryCalendarVideoConferencing {
    video_conference_widget = 'video_conference_widget',
    video_conference_settings_toggle = 'video_conference_settings_toggle',
    video_conference_zoom_integration = 'video_conference_zoom_integration',
}

export enum TelemetryMailNewsletterSubscriptions {
    newsletters_view_visit = 'newsletters_view_visit',
    newsletter_action = 'newsletter_action',
    newsletter_messages_action = 'newsletter_messages_action',
    newsletters_list_sorting = 'newsletters_list_sorting',
    newsletters_list_pagination = 'newsletters_list_pagination',
}

export enum TelemetryIcsSurgeryEvents {
    import = 'import',
    import_publish = 'import_publish',
    invitation = 'invitation',
    ics_parsing = 'ics_parsing',
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
    onboardingStart = 'fe.onboarding_start',
    onboardShown = 'fe.onboarding_shown',
    onboardFinish = 'fe.onboarding_finish',
    signupFinish = 'fe.signup_finish',
}

export enum TelemetryAccountCancellationEvents {
    startCancellation = 'start_cancellation',
    cancelPage = 'cancel_page',
    cancelModal = 'cancel_modal',
    feedbackModal = 'feedback_modal',
    resubscribeModal = 'resubscribe_modal',
    dashboardReactivate = 'dashboard_reactivate',
    upsellModal = 'upsell_modal',
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

export enum TelemetryAccountDashboardEvents {
    pageLoad = 'page_load',
}

export enum TelemetryKeyTransparencyErrorEvents {
    self_audit_error = 'self_audit_error',
    key_verification_failure = 'key_verification_failure',
}

export enum TelemetryDesktopEvents {
    client_first_launch = 'client_first_launch',
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

export enum TelemetryHeartbeatEvents {
    mail_heartbeat = 'mail_heartbeat',
    calendar_heartbeat = 'calendar_heartbeat',
}

export enum TelemetryInboxDestkopEvents {
    mailto_heartbeat = 'mailto_heartbeat',
    daily_stats_heartbeat = 'daily_stats_heartbeat',
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

export enum TelemetryVPNDrawerEvents {
    tooltip_displayed = 'tooltip_displayed',
    tooltip_clicked = 'tooltip_clicked',
    tooltip_dismissed = 'tooltip_dismissed',
    drawer_displayed = 'drawer_displayed',
    download_clicked = 'download_clicked',
    status_changed = 'status_changed',
}

export enum TelemetryPaymentsEvents {
    load_payment = 'load_payment',
    payment_attempt = 'payment_attempt',
    payment_success = 'payment_success',
    payment_failure = 'payment_failure',
}

export enum TelemetryDriveWebFeature {
    performance = 'drive_web_feature_performance_unauth',
    actions = 'drive_web_actions_unauth',
}

export enum TelemetryCollapsibleLeftSidebarEvents {
    toggleLeftSidebar = 'toggle_left_sidebar',
}

export enum TelemetryProtonTipsEvents {
    tipDispayed = 'tip_displayed',
    CTAButtonClicked = 'cta_clicked',
    tipChangeState = 'tip_change_state',
    closeButtonClicked = 'close_button_clicked',
    tipSnoozed = 'tip_snoozed',
}

export enum TelemetryMailListEvents {
    clicksMailListActions = 'clicks_mail_actions',
}

export enum TelemetrySmartBannerEvents {
    clickAppStoreLink = 'click_app_store_link',
}

export enum TelemetryDocsEvents {
    suggestion_created = 'suggestion.created',
    suggestion_resolved = 'suggestion.resolved',
    suggestion_commented = 'suggestion.comment',
}

export enum TelemetryDocsHomepageEvents {
    document_opened = 'document.opened',
    document_created = 'document.created',
    document_shared = 'document.shared',
    document_trashed = 'document.trashed',
    document_renamed = 'document.renamed',
    document_moved = 'document.moved',
    document_source_opened = 'document.source.opened',
    sorting_changed_to_name = 'sorting.changed.to_name',
    sorting_changed_to_time = 'sorting.changed.to_time',
}

export enum TelemetryPostSubscriptionTourEvents {
    post_subscription_action = 'post_subscription_action',
    start_feature_tour = 'start_feature_tour',
    quit_feature_tour = 'quit_feature_tour',
    finish_feature_tour = 'finish_feature_tour',
    replaced_default_short_domain_address = 'replaced_default_short_domain_address',
}

export enum TelemetryEncryptedSearchEvents {
    start_es_indexing = 'start_es_indexing',
    end_es_indexing = 'end_es_indexing',
    pause_es_indexing = 'pause_es_indexing',

    perform_search = 'perform_search',
    es_search_complete = 'es_search_complete',
    clear_search_fields = 'clear_search_fields',

    delete_es_data = 'delete_es_data',
    switch_search_type = 'switch_search_type',
}

export enum TelemetryB2BOnboardingEvents {
    modal_displayed = 'modal_displayed',
    click_modal_item = 'click_modal_item',
    hide_navbar_button = 'hide_navbar_button',
}

// Offers telemetry events
export enum TelemetryMailDrivePostSignupOneDollarEvents {
    automaticModalOpen = 'automatic_modal_open',
    clickUpsellButton = 'click_upsell_button',
    clickTopNavbar = 'click_top_navbar',
    closeOffer = 'close_offer',
    userSubscribed = 'user_subscribed',
}

export enum TelemetryPaidUsersNudge {
    clickUpsellButton = 'click_upsell_button',
    clickTopNavbar = 'click_top_navbar',
    closeOffer = 'close_offer',
    userSubscribed = 'user_subscribed',
    clickHideOffer = 'click_hide_offer',
}

export enum TelemetryPassNudgeEvents {
    banner_display = 'banner_display',
    banner_interaction = 'banner_interaction',
    pass_cta_click = 'pass_cta_click',
}

export enum TelemetryUnlimitedOffer2025 {
    clickTopNavbar = 'click_top_navbar',
    clickUpsellButton = 'click_upsell_button',
    closeOffer = 'close_offer',
    userSubscribed = 'user_subscribed',
    clickHideOffer = 'click_hide_offer',
}

export type TelemetryEvents =
    | TelemetrySubscriptionModalEvents
    | TelemetryMailTrial2024UpsellModal
    | TelemetryCalendarEvents
    | TelemetryIcsSurgeryEvents
    | TelemetryAccountSignupBasicEvents
    | TelemetryAccountSignupEvents
    | TelemetryAccountCancellationEvents
    | TelemetryAccountDashboardEvents
    | TelemetryKeyTransparencyErrorEvents
    | TelemetryMailEvents
    | TelemetryMailListEvents
    | TelemetryMailSelectAllEvents
    | TelemetryMailComposerAssistantEvents
    | TelemetryMailOnboardingEvents
    | TelemetryMailPagingControlsEvents
    | TelemetryChangelog
    | TelemetrySecurityCenterEvents
    | TelemetryVPNDrawerEvents
    | TelemetryPaymentsEvents
    | TelemetryAccountOrganizationLogoUploadEvents
    | TelemetryDriveWebFeature
    | TelemetryAccountSecurityCheckupEvents
    | TelemetryCollapsibleLeftSidebarEvents
    | TelemetryProtonTipsEvents
    | TelemetryHeartbeatEvents
    | TelemetrySmartBannerEvents
    | TelemetryDesktopEvents
    | TelemetryInboxDestkopEvents
    | TelemetryDocsEvents
    | TelemetryDocsHomepageEvents
    | TelemetryCalendarVideoConferencing
    | TelemetryEncryptedSearchEvents
    | TelemetryB2BOnboardingEvents
    | TelemetryPostSubscriptionTourEvents
    | TelemetryMailDrivePostSignupOneDollarEvents
    | TelemetryPaidUsersNudge
    | TelemetryPassNudgeEvents
    | TelemetryMailNewsletterSubscriptions
    | TelemetryUnlimitedOffer2025;

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
    keepalive: true,
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
        keepalive: true,
        data: { EventInfo },
    };
};
