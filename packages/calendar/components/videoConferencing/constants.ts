export enum VIDEO_CONF_SERVICES {
    ZOOM = 'zoom',
    GOOGLE_MEET = 'google-meet',
}

export const SEPARATOR_GOOGLE_EVENTS =
    '-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-' as const;

export interface BaseMeetingUrls {
    service: VIDEO_CONF_SERVICES;
    meetingUrl?: string;
    meetingId?: string;
    joiningInstructions?: string;
    meetingHost?: string;
    password?: string; // This is used by Zoom meetings
}
