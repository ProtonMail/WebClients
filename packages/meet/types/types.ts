import type { ChatMessage } from 'livekit-client';

import type { MeetingType, WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

export interface CreateMeetingParams {
    meetingName: string;
    startTime?: string | null;
    endTime?: string | null;
    recurrence?: string | null;
    timeZone?: string | null;
    type?: MeetingType;
    protonCalendar?: boolean;
    waitingRoom?: WaitingRoomState;
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
    MeetingExpiredHostFree = 'meetingExpiredHostFree',
    MeetingExpiredHostPaid = 'meetingExpiredHostPaid',
    RemovedFromMeeting = 'removedFromMeeting',
}

export type ChatMessageReactions = Record<string, string[]>;

export type ChatMessageStatus = 'pending' | 'sent' | 'failed';

export interface MeetChatMessage extends Pick<ChatMessage, 'id' | 'message' | 'timestamp'> {
    identity: string;
    seen?: boolean;
    type?: 'message';
    reactions?: ChatMessageReactions;
    /** Id of the message this message is a reply to (only set for replies). */
    inReplyToId?: string;
    /** Id of the thread/topic this message belongs to. Root messages of a thread share their id as topic. */
    topicId?: string;
    /** Delivery status; only set for messages sent by the local participant. */
    status?: ChatMessageStatus;
    /** Whether the thread started by this (root) message is expanded. Only meaningful on root messages. */
    expanded?: boolean;
    /** Unsent reply text for the thread started by this (root) message. Only meaningful on root messages. */
    replyDraft?: string;
    /**
     * Placeholder root message created to anchor a thread whose actual root message is not available
     * locally (e.g. it was sent before the local participant joined). It carries no real content.
     */
    isMissingRoot?: boolean;
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
    isAgent?: boolean;
}

export type MeetingRoomUpdate = ParticipantEventRecord | MeetChatMessage;

export enum ParticipantCapabilityPermission {
    NotAllowed = 0,
    Allowed = 1,
}

export interface ParticipantEntity {
    ParticipantUUID: string;
    EncryptedDisplayName: string;
    CanSubscribe?: ParticipantCapabilityPermission;
    CanPublish?: ParticipantCapabilityPermission;
    CanPublishData?: ParticipantCapabilityPermission;
    IsAdmin?: ParticipantCapabilityPermission;
    IsHost?: ParticipantCapabilityPermission;
}

export type MLSGroupState = {
    displayCode: string | null;
    epoch: Number;
    memberCount: number | null;
};
export interface KeyRotationLog {
    timestamp: number;
    epoch: number;
    type: 'log' | 'error';
    message: string;
}
