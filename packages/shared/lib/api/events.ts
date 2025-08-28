export const getLatestID = () => ({
    url: 'core/v4/events/latest',
    method: 'get',
});

export const getEvents = (
    eventID: string,
    params?: {
        ConversationCounts: 1 | 0;
        MessageCounts: 1 | 0;
    }
) => ({
    url: `core/v5/events/${eventID}`,
    method: 'get',
    params,
});

export const getLatestCoreEventIDV6 = () => ({
    url: 'core/v6/events/latest',
    method: 'get',
});

export const getCoreEventsV6 = (eventID: string) => ({
    url: `core/v6/events/${eventID}`,
    method: 'get',
});

export const getLatestMailEventIDV6 = () => ({
    url: 'mail/v6/events/latest',
    method: 'get',
});

export const getMailEventsV6 = (eventID: string) => ({
    url: `mail/v6/events/${eventID}`,
    method: 'get',
});

export const getLatestContactEventIDV6 = () => ({
    url: 'contacts/v6/events/latest',
    method: 'get',
});

export const getContactEventsV6 = (eventID: string) => ({
    url: `contacts/v6/events/${eventID}`,
    method: 'get',
});

export const getLatestCalendarEventIDV6 = () => ({
    url: 'calendar/v6/events/latest',
    method: 'get',
});

export const getCalendarEventsV6 = (eventID: string) => ({
    url: `calendar/v6/events/${eventID}`,
    method: 'get',
});

export enum ActionEventV6 {
    Delete = 0,
    Create = 1,
    Update = 2,
}

export type EventV6Item = {
    ID: string;
    Action: ActionEventV6;
};

export type EventV6Response = null | EventV6Item[];

interface EventV6Defaults {
    More: boolean;
    Refresh: boolean;
    EventID: string;
}

export interface CoreEventV6Response extends EventV6Defaults {
    Users: EventV6Response;
    Addresses: EventV6Response;
    UserSettings: EventV6Response;
    Organizations: EventV6Response;
    OrganizationSettings: EventV6Response;
    Subscriptions: EventV6Response;
    Members: EventV6Response;
    GroupMembers: EventV6Response;
    Domains: EventV6Response;
    PaymentsMethods: EventV6Response;
    UserInvitations: EventV6Response;
    Sso: EventV6Response;
    Groups: EventV6Response;
    Imports: EventV6Response;
    ImportReports: EventV6Response;
    ImporterSyncs: EventV6Response;
    Invoices: EventV6Response;
    OutgoingDelegatedAccess: EventV6Response;
    IncomingDelegatedAccess: EventV6Response;
}

export interface MailEventV6Response extends EventV6Defaults {
    MailSettings: EventV6Response;
    Labels: EventV6Response;
    Filters: EventV6Response;
    IncomingForwardings: EventV6Response;
    OutgoingForwardings: EventV6Response;
}

export interface ContactEventV6Response extends EventV6Defaults {
    Contacts: EventV6Response;
    ContactEmails: EventV6Response;
}

export interface CalendarEventV6Response extends EventV6Defaults {
    Calendars: EventV6Response;
}
