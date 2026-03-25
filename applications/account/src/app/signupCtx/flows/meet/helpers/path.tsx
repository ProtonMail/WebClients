export enum MeetSignupIntent {
    Schedule = 'schedule',
    Room = 'room',
}

export const isMeetSignupIntent = (value: string | null | undefined): value is MeetSignupIntent => {
    return value === MeetSignupIntent.Schedule || value === MeetSignupIntent.Room;
};

export const getMeetSignupIntentFromSearchParams = (params: URLSearchParams): MeetSignupIntent | undefined => {
    const raw = params.get('intent');
    return isMeetSignupIntent(raw) ? raw : undefined;
};

export const getMeetPostLoginPath = (intent: MeetSignupIntent) => {
    return `/?intent=${encodeURIComponent(intent)}`;
};
