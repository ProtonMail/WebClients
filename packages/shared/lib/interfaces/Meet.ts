import type { EventV6Response } from '@proton/shared/lib/api/events';

export enum CustomPasswordState {
    NO_PASSWORD = 0,
    PASSWORD_SET = 1,
}

export enum ProtonCalendarState {
    NOT_FROM_PROTON_CALENDAR = 0,
    FROM_PROTON_CALENDAR = 1,
}

enum EnumLockedState {
    UNLOCKED = 0,
    LOCKED = 1,
}

export enum PersonalMeetingState {
    NOT_YOUR_PERSONAL = 0,
    YOUR_PERSONAL = 1,
}

export interface MeetingInfoResponse {
    MeetingInfo: {
        MeetingLinkName: string;
        Salt: string;
        SessionKey: string;
        MeetingName: string;
        CustomPassword: CustomPasswordState;
        Locked: EnumLockedState;
        MaxDuration: number;
        MaxParticipants: number;
        ExpirationTime: number | null;
        WaitingRoom?: number; // 1 = waiting room enabled
        ManageWaitingRoom?: number; // 1 = you can manage the waiting room, i.e. you are the host
        PersonalMeeting?: PersonalMeetingState; // 1 = is your personal meeting room
    };
    Code: 1000;
}

export interface AccessTokenResponse {
    AccessToken: string;
    WebsocketUrl: string;
    Code: 1000;
}

export enum MeetingState {
    DELETED = 0,
    ACTIVE = 1,
}

export enum MeetingType {
    INSTANT = 0,
    PERSONAL = 1,
    SCHEDULED = 2,
    RECURRING = 3,
    PERMANENT = 4,
}

export enum WaitingRoomState {
    DISABLED = 0,
    ENABLED = 1,
}

export interface MeetingPayload {
    AddressID: string | null;
    Name?: string;
    Password: string | null;
    Salt: string;
    SessionKey: string;
    SRPModulusID: string;
    SRPSalt: string;
    SRPVerifier: string;
    StartTime: string | null;
    EndTime: string | null;
    RRule: string | null;
    Timezone: string | null;
    State?: MeetingState;
    Type: MeetingType;
    CustomPassword: CustomPasswordState;
    ProtonCalendar?: ProtonCalendarState;
    // Make WaitingRoom mandatory when cleanup MeetWaitingRoom feature flag
    WaitingRoom?: WaitingRoomState;
}

export interface Meeting extends Omit<MeetingPayload, 'Name'> {
    CreateTime: number;
    LastUsedTime: number | null;
    ID: string;
    MeetingName: string;
    MeetingLinkName: string;
    CalendarEventID?: string;
    CalendarID?: string;
}

export interface UserSettings {
    MeetingID: string;
    AddressID: string;
    CaptionLanguage?: string | null;
}

export interface CreateMeetingResponse {
    Meeting: Meeting;
    Code: 1000;
}

export interface MeetingInfo {
    Salt: string;
    SessionKey: string;
    MeetingName: string;
    MeetingLinkName: string;
}

export interface RotatePersonalMeetingResponse {
    Meeting: Meeting;
    Code: 1000;
}

export enum ParticipantCapabilityPermission {
    NotAllowed = 0,
    Allowed = 1,
}

export interface ParticipantPermissions {
    Publish: ParticipantCapabilityPermission;
    PublishData: ParticipantCapabilityPermission;
    Subscribe: ParticipantCapabilityPermission;
    Admin: ParticipantCapabilityPermission;
}

interface EventV6Defaults {
    More: boolean;
    Refresh: boolean;
    EventID: string;
}

export interface MeetEventResponse extends EventV6Defaults {
    MeetMeetings: EventV6Response;
}
