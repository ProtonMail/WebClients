/**
 * Fields the API sends under `EventData`, camelCased by `toCamelCase`. Which of these are present
 * depends on the event type, so all are optional and consumers must handle their absence.
 */
export interface PassEventData {
    vaultId?: string;
    itemId?: string;
    inviteId?: string;
    /** Email the invite was sent to, on `Invite*` events. */
    invitedEmail?: string;
    /** Email the vault or item was shared with, on `ShareCreated` and `ShareUpdated`. */
    shareEmail?: string;
    /** Monitored custom email, on the Pass Monitor `BreachCustomEmail*` events. */
    email?: string;
}

export interface PassEvent {
    time: string;
    user: {
        name: string;
        email: string;
    };
    eventType: string;
    /** Localized server-side from `x-pm-locale`, so it is rendered as-is. */
    eventTypeName: string;
    ip: string;
    /** Absent on some event types, and not guaranteed even where the contract expects it. */
    eventData?: PassEventData;
}
