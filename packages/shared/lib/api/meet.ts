import type { MeetingPayload, UpdateMeetingPasswordData } from '../interfaces/Meet';

export const queryParticipants = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${meetingLinkName}/participants`,
    };
};

export const queryInitMeetSRPHandshake = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${meetingLinkName}/info`,
    };
};

export const queryMeetAuth = (meetingLinkName: string) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/links/${meetingLinkName}/auth`,
    };
};

export const queryMeetingInfo = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${meetingLinkName}`,
    };
};

export const queryMeetAccessToken = (meetingLinkName: string) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/links/${meetingLinkName}/access-tokens`,
    };
};

export const getUpcomingMeetingsQuery = {
    method: 'get',
    url: `meet/v1/meetings/upcoming`,
};

export const deleteMeetingCall = (meetingId: string) => {
    return {
        method: 'delete',
        url: `meet/v1/meetings/${meetingId}`,
    };
};

export const getMeetUserSettings = {
    method: 'get',
    url: `meet/v1/user-settings`,
};

export const createMeetingCall = (data: MeetingPayload) => {
    return {
        method: 'post',
        url: 'meet/v1/meetings',
        data,
    };
};

export const getMeetingCall = (meetingId: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/${meetingId}`,
    };
};

export const getMeetingByLinkNameCall = (meetingId: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/by-link/${meetingId}`,
    };
};

export const updateMeetingPasswordCall = (meetingId: string, data: UpdateMeetingPasswordData) => {
    return {
        method: 'put',
        url: `meet/v1/meetings/${meetingId}/password`,
        data,
    };
};

export const updateMeetingNameCall = (meetingId: string, data: { Name: string }) => {
    return {
        method: 'put',
        url: `meet/v1/meetings/${meetingId}/name`,
        data,
    };
};

export const lockMeetingCall = (meetingLinkName: string, data: { AccessToken: string }) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/links/${meetingLinkName}/lock`,
        data,
    };
};

export const unlockMeetingCall = (meetingLinkName: string, data: { AccessToken: string }) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/links/${meetingLinkName}/unlock`,
        data,
    };
};

export const rotatePersonalMeetingLink = (data: MeetingPayload) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/personal/rotate`,
        data,
    };
};
