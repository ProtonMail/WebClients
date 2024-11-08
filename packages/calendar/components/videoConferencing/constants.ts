export enum VIDEO_CONF_SERVICES {
    ZOOM = 'zoom',
    GOOGLE_MEET = 'google-meet',
}

export const SEPARATOR_GOOGLE_EVENTS =
    '-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-' as const;

export const SEPARATOR_PROTON_EVENTS =
    '~-~-~-~-~-~-~%~!~%~!~%~!~%~!~%~!~%~!~%~!~%~!~%~!~%~!~%~!~%~!~%~!~-~-~-~-~-~-~' as const;

export interface BaseMeetingUrls {
    service: VIDEO_CONF_SERVICES;
    meetingCreator?: string;
    meetingUrl?: string;
    meetingId?: string;
    joiningInstructions?: string;
    meetingHost?: string;
    password?: string; // This is used by Zoom meetings
}

export enum VIDEO_CONF_API_ERROR_CODES {
    MEETING_PROVIDER_ERROR = 2904,
}

export type ZoomAccessLevel = 'show-upsell' | 'limited-access' | 'full-access';
