export enum MeetSignupIntent {
    Schedule = 'schedule',
    Rooms = 'rooms',
    PersonalRoom = 'personal-room',
}

export const isMeetSignupIntent = (value: string | null | undefined): value is MeetSignupIntent => {
    return (
        value === MeetSignupIntent.Schedule ||
        value === MeetSignupIntent.Rooms ||
        value === MeetSignupIntent.PersonalRoom
    );
};

export const getMeetSignupIntentFromSearchParams = (params: URLSearchParams): MeetSignupIntent | undefined => {
    const raw = params.get('intent');
    return isMeetSignupIntent(raw) ? raw : undefined;
};
