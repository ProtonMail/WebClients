import {
    TelemetryMeetActionsEvents as Actions,
    type TelemetryMeetDashboardEvents as Dashboard,
    TelemetryMeetPerformanceEvents as Performance,
} from '@proton/shared/lib/api/telemetry';

export type ToggleState = 'on' | 'off';

export type UserType = 'auth' | 'guest';
export type Platform = 'web' | 'desktop';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type Role = 'host' | 'admin' | 'participant';

export type JoinSource = 'link' | 'dashboard' | 'instant';
export type MeetingTypeDimension = 'instant' | 'personal' | 'scheduled' | 'recurring' | 'permanent' | 'unknown';
export type DeviceKind = 'audioinput' | 'videoinput' | 'audiooutput';
export type PermissionKind = 'camera' | 'microphone' | 'screen';
export type BackgroundEffectType = 'none' | 'blur' | 'preset' | 'custom';
export type LayoutDimension = 'gallery' | 'speaker' | 'screen_share';
export type MediaToggleTrigger = 'button' | 'keyboard_shortcut' | 'host_action';
export type PictureInPictureTrigger =
    'screen_share_start' | 'window_blur' | 'browser_media_control' | 'user_closed' | 'screen_share_end';
type LayoutTrigger = 'manual' | 'auto_screen_share';
type SuccessOutcome = 'success' | 'failed';
export type PermissionOutcome = 'granted' | 'denied' | 'dismissed';
type CaptionsFailureReason = 'agent_start_timeout' | 'agent_stopped' | 'request_failed' | 'transcription_failed';
export type BackgroundSizeBucket = '0-1MB' | '1-5MB' | '5-10MB';
export type WaitTimeBucket = '0-30s' | '30s-2m' | '2-5m' | '5m+';
export type RecordingDurationBucket = '0-5m' | '5-15m' | '15-30m' | '30-60m' | '60m+';
export type RecordingSizeBucket = '0-20MB' | '20-100MB' | '100-500MB' | '500MB+';
export type ParticipantCountBucket = '1' | '2-4' | '5-10' | '11-25' | '26+';
export type IceTransport = 'direct' | 'stun' | 'turn_relay' | 'n/a';
export type EntryRoute = 'dashboard' | 'join' | 'manage-recordings' | 'start-free-meeting';
type MeetingLinkCopySource =
    | 'dashboard'
    | 'prejoin'
    | 'participant_list'
    | 'meeting_details'
    | 'meeting_ready_popup'
    | 'schedule_form'
    | 'schedule_recap'
    | 'room_created';

type NoDimensions = Record<string, never>;

/** Event specific dimensions, the common ones are added by the sender. */
export interface MeetActionsDimensions {
    [Actions.prejoin_viewed]: {
        joinSource: JoinSource;
        meetingType: MeetingTypeDimension;
        isWaitingRoomEnabled: boolean;
    };
    [Actions.display_name_entered]: { isPersisted: boolean; isPrefilled: boolean };
    [Actions.waiting_room_toggled]: { state: ToggleState };
    [Actions.waiting_room_retry_clicked]: { reason: 'expired' | 'rejected' };
    [Actions.desktop_app_banner_shown]: NoDimensions;
    [Actions.desktop_app_banner_clicked]: { action: 'open_app' | 'download' | 'dismiss' };
    [Actions.join_clicked]: { micState: ToggleState; cameraState: ToggleState; backgroundEffect: BackgroundEffectType };
    [Actions.mic_toggled]: { state: ToggleState; trigger: MediaToggleTrigger };
    [Actions.camera_toggled]: { state: ToggleState; trigger: MediaToggleTrigger };
    [Actions.device_selected]: { deviceKind: DeviceKind; source: 'prejoin' | 'in_call_popup' };
    [Actions.camera_rotated]: { cameraFacing: 'front' | 'back' };
    [Actions.mic_test_completed]: { outcome: SuccessOutcome };
    [Actions.speaker_test_completed]: { outcome: SuccessOutcome };
    [Actions.permission_requested]: { permissionKind: PermissionKind; outcome: PermissionOutcome };
    [Actions.permission_blocked_modal_shown]: { permissionKind: PermissionKind };
    [Actions.no_device_detected]: { deviceKind: DeviceKind };
    [Actions.noise_cancellation_toggled]: { state: ToggleState; noiseCancellationModel: string };
    [Actions.background_effect_selected]: {
        effectType: BackgroundEffectType;
        source: 'prejoin' | 'in_call_popup' | 'settings';
    };
    [Actions.custom_background_uploaded]: { outcome: SuccessOutcome; sizeBucket: BackgroundSizeBucket };
    [Actions.custom_background_deleted]: NoDimensions;
    [Actions.screen_share_toggled]: {
        state: ToggleState;
        hasAudio: boolean;
        outcome: SuccessOutcome | 'cancelled';
    };
    [Actions.screen_share_leave_warning_answered]: { action: 'continue' | 'cancel' };
    [Actions.picture_in_picture_toggled]: { state: ToggleState; trigger: PictureInPictureTrigger };
    [Actions.layout_changed]: { fromLayout: LayoutDimension; toLayout: LayoutDimension; trigger: LayoutTrigger };
    [Actions.self_view_toggled]: { state: ToggleState };
    [Actions.incoming_video_toggled]: { state: ToggleState };
    [Actions.participant_list_toggled]: { state: ToggleState };
    [Actions.participant_muted_by_host]: { trackKind: 'audio' | 'video' };
    [Actions.participant_removed]: NoDimensions;
    [Actions.host_assigned]: NoDimensions;
    [Actions.hand_lowered_by_host]: NoDimensions;
    [Actions.waiting_room_admission_handled]: { admissionDecision: 'admit' | 'deny'; waitTimeBucket: WaitTimeBucket };
    [Actions.poor_connection_indicator_shown]: { networkQuality: 'poor' | 'lost' };
    [Actions.chat_toggled]: { state: ToggleState };
    [Actions.chat_reaction_sent]: NoDimensions;
    [Actions.chat_mention_used]: NoDimensions;
    [Actions.chat_scrolled_to_message]: { source: 'snackbar' };
    [Actions.emoji_reaction_sent]: NoDimensions;
    [Actions.hand_raise_toggled]: { state: ToggleState };
    [Actions.captions_toggled]: { state: ToggleState; captionsScope: 'self' | 'host_availability' };
    [Actions.captions_failed]: { captionsFailureReason: CaptionsFailureReason };
    [Actions.recording_toggled]: { state: ToggleState; outcome: SuccessOutcome };
    [Actions.recording_upsell_shown]: NoDimensions;
    [Actions.recording_upsell_clicked]: NoDimensions;
    [Actions.recording_download_prompt_answered]: {
        action: 'download' | 'dismiss';
        recordingDurationBucket: RecordingDurationBucket;
    };
    [Actions.settings_opened]: { source: 'toolbar' | 'more_menu' };
    [Actions.meeting_lock_toggled]: { state: ToggleState };
    [Actions.meeting_details_opened]: NoDimensions;
    [Actions.connection_lost_modal_shown]: NoDimensions;
    [Actions.connection_lost_modal_answered]: { action: 'rejoin' | 'leave'; outcome: SuccessOutcome };
}

export interface MeetActionsValues {
    [Actions.waiting_room_retry_clicked]: { attemptNumber: number };
}

/** Events of meet.web.actions that carry the role of the user in the meeting. */
export const MEET_ACTIONS_WITH_ROLE = new Set<Actions>([
    Actions.mic_toggled,
    Actions.camera_toggled,
    Actions.screen_share_toggled,
    Actions.screen_share_leave_warning_answered,
    Actions.picture_in_picture_toggled,
    Actions.layout_changed,
    Actions.self_view_toggled,
    Actions.incoming_video_toggled,
    Actions.participant_list_toggled,
    Actions.participant_muted_by_host,
    Actions.participant_removed,
    Actions.host_assigned,
    Actions.hand_lowered_by_host,
    Actions.waiting_room_admission_handled,
    Actions.poor_connection_indicator_shown,
    Actions.chat_toggled,
    Actions.chat_scrolled_to_message,
    Actions.hand_raise_toggled,
    Actions.captions_toggled,
    Actions.captions_failed,
    Actions.recording_toggled,
    Actions.recording_upsell_shown,
    Actions.recording_upsell_clicked,
    Actions.recording_download_prompt_answered,
    Actions.meeting_lock_toggled,
    Actions.meeting_details_opened,
    Actions.connection_lost_modal_shown,
    Actions.connection_lost_modal_answered,
]);

export interface MeetDashboardDimensions {
    [Dashboard.dashboard_viewed]: { hasPersonalRoom: boolean };
    [Dashboard.meeting_started_instant]: { source: 'dashboard' | 'guest_dashboard' | 'deeplink' };
    [Dashboard.join_with_link_opened]: NoDimensions;
    [Dashboard.join_with_link_submitted]: { isLinkValid: boolean };
    [Dashboard.schedule_meeting_opened]: { destination: 'in_app' | 'calendar_redirect' };
    [Dashboard.meeting_scheduled]: { hasWaitingRoom: boolean };
    [Dashboard.room_created]: { hasWaitingRoom: boolean };
    [Dashboard.room_edited]: { fieldsChanged: string };
    [Dashboard.meeting_deleted]: { meetingKind: 'scheduled' | 'room' };
    [Dashboard.meeting_link_copied]: { source: MeetingLinkCopySource };
    [Dashboard.personal_link_rotated]: NoDimensions;
    [Dashboard.upsell_banner_shown]: NoDimensions;
    [Dashboard.upsell_banner_clicked]: NoDimensions;
    [Dashboard.recordings_page_viewed]: NoDimensions;
    [Dashboard.recording_downloaded]: { sizeBucket: RecordingSizeBucket };
    [Dashboard.recording_deleted]: { sizeBucket: RecordingSizeBucket };
    [Dashboard.sign_in_clicked]: { source: 'guest_dashboard' | 'prejoin' };
    [Dashboard.sign_up_clicked]: NoDimensions;
}

export interface MeetPerformanceDimensions {
    [Performance.app_loaded]: {
        entryRoute: EntryRoute;
        wasmMode: 'worker' | 'direct';
        isColdStart: boolean;
        isPreloadHit: boolean | 'n/a';
    };
    [Performance.join_succeeded]: {
        joinSource: JoinSource;
        meetingType: MeetingTypeDimension;
        iceTransport: IceTransport;
        participantCountBucket: ParticipantCountBucket;
    };
}

/** Events of meet.web.performance that carry the role of the user in the meeting. */
export const MEET_PERFORMANCE_WITH_ROLE = new Set<Performance>([Performance.join_succeeded]);

export interface MeetPerformanceValues {
    [Performance.app_loaded]: {
        ttfbMs?: number;
        bootstrapStartMs?: number;
        sessionMs?: number;
        cryptoInitMs?: number;
        wasmInitMs?: number;
        unleashMs?: number;
        interactiveMs?: number;
        totalMs?: number;
        prejoinReadyMs?: number;
    };
    [Performance.join_succeeded]: {
        srpMs?: number;
        meetingInfoMs?: number;
        tokenFetchMs?: number;
        mlsSetupMs?: number;
        e2eeEnableMs?: number;
        deviceInitMs?: number;
        livekitConnectMs?: number;
        firstRemoteAudioMs?: number;
        firstRemoteVideoMs?: number;
        totalJoinMs?: number;
    };
}
