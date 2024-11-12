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
    ORGANIZATION_NOT_EXISTING = 2501,
    FEATURE_DISABLED = 2032,
    INVALID_VALUE = 2001,
    PROVIDER_FAILED = 2902,
    PROVIDER_UNAVAILABLE = 2900,
    MEETING_PROVIDER_ERROR = 2904,
}

export type ZoomAccessLevel = 'show-upsell' | 'limited-access' | 'full-access';
