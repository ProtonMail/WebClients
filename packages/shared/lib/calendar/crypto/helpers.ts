type SignatureContext = 'calendar.sharing.invite' | 'calendar.rsvp.comment';

export function getSignatureContext(context: 'calendar.sharing.invite'): 'calendar.sharing.invite';
export function getSignatureContext<TEventID extends string>(
    context: 'calendar.rsvp.comment',
    sharedEventID: TEventID
): `calendar.rsvp.comment.${TEventID}`;
export function getSignatureContext(context: SignatureContext, eventID?: string) {
    switch (context) {
        case 'calendar.sharing.invite':
            return 'calendar.sharing.invite';
        case 'calendar.rsvp.comment':
            return `calendar.rsvp.comment.${eventID}`;
    }
}
