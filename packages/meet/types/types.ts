import type { ChatMessage } from 'livekit-client';

import type { MeetingType } from '@proton/shared/lib/interfaces/Meet';

export interface CreateMeetingParams {
    meetingName: string;
    startTime?: string | null;
    endTime?: string | null;
    recurrence?: string | null;
    timeZone?: string | null;
    customPassword?: string;
    type?: MeetingType;
    protonCalendar?: boolean;
}

export enum UpsellModalTypes {
    Schedule = 'schedule',
    Room = 'room',
    PersonalMeeting = 'personalMeeting',
    HostFreeAccount = 'hostFreeAccount',
    HostPaidAccount = 'hostPaidAccount',
    GuestAccount = 'guestAccount',
    FreeAccount = 'freeAccount',
    PaidAccount = 'paidAccount',
    MeetingEnded = 'meetingEnded',
    RemovedFromMeeting = 'removedFromMeeting',
}

export interface MeetChatMessage extends Pick<ChatMessage, 'id' | 'message' | 'timestamp'> {
    identity: string;
    seen?: boolean;
    type?: 'message';
}

export enum ParticipantEvent {
    Join = 'join',
    Leave = 'leave',
}

export interface ParticipantEventRecord {
    identity: string;
    eventType: ParticipantEvent;
    timestamp: number;
    type?: 'event';
}

export type MeetingRoomUpdate = ParticipantEventRecord | MeetChatMessage;

export enum ParticipantCapabilityPermission {
    NotAllowed = 0,
    Allowed = 1,
}

export interface ParticipantEntity {
    ParticipantUUID: string;
    DisplayName: string;
    CanSubscribe?: ParticipantCapabilityPermission;
    CanPublish?: ParticipantCapabilityPermission;
    CanPublishData?: ParticipantCapabilityPermission;
    IsAdmin?: ParticipantCapabilityPermission;
    IsHost?: ParticipantCapabilityPermission;
}

export type MLSGroupState = {
    displayCode: string | null;
    epoch: Number;
};
export interface KeyRotationLog {
    timestamp: number;
    epoch: number;
    type: 'log' | 'error';
    message: string;
}
