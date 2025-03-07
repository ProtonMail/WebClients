export const SIGNATURE_CONTEXT = {
    SHARE_CALENDAR_INVITE: 'calendar.sharing.invite',
    ATTENDEE_COMMENT: (sharedEventID: string) => `calendar.rsvp.comment.${sharedEventID}`,
};
