import { getAttendeeEmail, getDuplicateAttendees } from 'proton-shared/lib/calendar/attendees';
import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import {
    createInviteIcs,
    generateEmailBody,
    generateEmailSubject,
    generateVtimezonesComponents,
    getHasUpdatedInviteData,
} from 'proton-shared/lib/calendar/integration/invite';
import { getAttendeePartstat, getHasAttendees } from 'proton-shared/lib/calendar/vcalHelper';
import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { getIsAddressActive } from 'proton-shared/lib/helpers/address';
import { canonizeEmailByGuess } from 'proton-shared/lib/helpers/email';
import { Recipient } from 'proton-shared/lib/interfaces';
import { VcalAttendeeProperty, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { GetVTimezonesMap } from 'proton-shared/lib/interfaces/hooks/GetVTimezonesMap';
import { SendPreferences } from 'proton-shared/lib/interfaces/mail/crypto';
import { RequireSome, SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { SendIcsParams } from 'react-components/hooks/useSendIcs';
import { INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';

const {
    SEND_INVITATION,
    SEND_UPDATE,
    CHANGE_PARTSTAT,
    DECLINE_INVITATION,
    DECLINE_DISABLED,
    CANCEL_INVITATION,
    CANCEL_DISABLED,
    NONE,
} = INVITE_ACTION_TYPES;

const getAttendeesDiff = (newVevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    const normalizedNewEmails = (newVevent.attendee || []).map((attendee) =>
        canonizeEmailByGuess(getAttendeeEmail(attendee))
    );
    const normalizedOldEmails = (oldVevent.attendee || []).map((attendee) =>
        canonizeEmailByGuess(getAttendeeEmail(attendee))
    );
    const addedAttendees = newVevent.attendee?.filter((attendee) => {
        const normalizedNewEmail = canonizeEmailByGuess(getAttendeeEmail(attendee));
        return !normalizedOldEmails.includes(normalizedNewEmail);
    });
    const removedAttendees = oldVevent.attendee?.filter((attendee) => {
        const normalizedOldEmail = canonizeEmailByGuess(getAttendeeEmail(attendee));
        return !normalizedNewEmails.includes(normalizedOldEmail);
    });
    return { addedAttendees, removedAttendees };
};

export const getDuplicateAttendeesSend = (vevent: VcalVeventComponent, inviteActions: InviteActions) => {
    const { type, addedAttendees, removedAttendees } = inviteActions;
    // we only need to check for duplicates among the attendees newly added to the event
    if (type === INVITE_ACTION_TYPES.SEND_INVITATION) {
        if (!addedAttendees?.length && !removedAttendees?.length) {
            // it's a new invitation
            return getDuplicateAttendees(vevent.attendee);
        }
        if (addedAttendees?.length) {
            return getDuplicateAttendees(addedAttendees);
        }
    }
    if (type === INVITE_ACTION_TYPES.SEND_UPDATE) {
        return getDuplicateAttendees(vevent.attendee);
    }
};

export const getUpdatedSaveInviteActions = ({
    inviteActions,
    newVevent,
    oldVevent,
    hasModifiedDateTimes,
}: {
    inviteActions: InviteActions;
    newVevent: VcalVeventComponent;
    oldVevent?: VcalVeventComponent;
    hasModifiedDateTimes?: boolean;
}) => {
    const { type } = inviteActions;
    const hasNewAttendees = getHasAttendees(newVevent);
    const hasOldAttendees = oldVevent ? getHasAttendees(oldVevent) : false;
    if (type !== SEND_INVITATION) {
        return { ...inviteActions };
    }
    if (!oldVevent) {
        // it's a create event operation
        if (!hasNewAttendees) {
            // no need to send any invitation in this case
            return {
                ...inviteActions,
                type: NONE,
            };
        }
        return { ...inviteActions };
    }
    if (!hasNewAttendees && !hasOldAttendees) {
        // no need to send any invitation in this case
        return {
            ...inviteActions,
            type: NONE,
        };
    }
    const hasInviteDataModification = getHasUpdatedInviteData({ newVevent, oldVevent, hasModifiedDateTimes });
    const { addedAttendees, removedAttendees } = getAttendeesDiff(newVevent, oldVevent);
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    const hasRemovedAllAttendees = hasRemovedAttendees && removedAttendees?.length === oldVevent.attendee?.length;
    if (hasInviteDataModification) {
        return {
            ...inviteActions,
            type: hasOldAttendees ? SEND_UPDATE : SEND_INVITATION,
            addedAttendees,
            removedAttendees,
            hasRemovedAllAttendees,
        };
    }
    if (!hasAddedAttendees && !hasRemovedAttendees) {
        // no need to send any invitation in this case
        return {
            ...inviteActions,
            type: NONE,
        };
    }
    return { ...inviteActions, addedAttendees, removedAttendees, hasRemovedAllAttendees };
};

export const getUpdatedDeleteInviteActions = ({
    inviteActions,
    oldVevent,
}: {
    inviteActions: InviteActions;
    oldVevent?: VcalVeventComponent;
}) => {
    const { type, selfAddress } = inviteActions;
    const hasAttendees = oldVevent ? getHasAttendees(oldVevent) : false;
    const active = selfAddress ? getIsAddressActive(selfAddress) : undefined;
    if (type === CANCEL_INVITATION) {
        if (!hasAttendees) {
            return {
                ...inviteActions,
                type: NONE,
            };
        }
        if (!active) {
            return {
                ...inviteActions,
                type: CANCEL_DISABLED,
            };
        }
    }
    if (type === DECLINE_INVITATION && !active) {
        return {
            ...inviteActions,
            type: DECLINE_DISABLED,
        };
    }
    return { ...inviteActions };
};

// Remove attendees we cannot send to
const getSafeSendTo = (attendees: VcalAttendeeProperty[], map: SimpleMap<SendPreferences>) => {
    return attendees.reduce<RequireSome<Recipient, 'Address' | 'Name'>[]>((acc, attendee) => {
        const email = getAttendeeEmail(attendee);
        if (!map[email]?.error) {
            acc.push({
                Address: email,
                Name: attendee.parameters?.cn || email,
            });
        }
        return acc;
    }, []);
};

export const getSendIcsAction = ({
    vevent,
    cancelVevent,
    inviteActions,
    sendIcs,
    sendPreferencesMap,
    contactEmailsMap,
    prodId,
    getVTimezonesMap,
    onRequestError,
    onReplyError,
    onCancelError,
}: {
    vevent?: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
    inviteActions: InviteActions;
    sendIcs: (params: SendIcsParams) => Promise<void>;
    sendPreferencesMap: SimpleMap<SendPreferences>;
    contactEmailsMap: SimpleMap<ContactEmail>;
    getVTimezonesMap: GetVTimezonesMap;
    prodId: string;
    onRequestError: (e: Error) => void;
    onReplyError: (e: Error) => void;
    onCancelError: (e: Error) => void;
}) => async () => {
    const {
        type,
        sharedEventID,
        sharedSessionKey,
        selfAddress,
        selfAttendeeIndex,
        partstat,
        addedAttendees,
        removedAttendees,
    } = inviteActions;
    if (!selfAddress) {
        throw new Error('Cannot reply without a self address');
    }
    if (!getIsAddressActive(selfAddress)) {
        throw new Error('Cannot send from an inactive address');
    }
    const addressID = selfAddress.ID;
    const from = { Address: selfAddress.Email, Name: selfAddress.DisplayName || selfAddress.Email };
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    if (type === SEND_INVITATION) {
        try {
            if (!vevent) {
                throw new Error('Cannot build invite ics without the event component');
            }
            if (!sharedEventID || !sharedSessionKey) {
                throw new Error('Missing shared event data');
            }
            const { attendee: attendees } = vevent;
            const vtimezones = FEATURE_FLAGS.includes('use-vtimezones')
                ? await generateVtimezonesComponents(vevent, getVTimezonesMap)
                : [];
            const pmVevent = FEATURE_FLAGS.includes('proton-proton-invites')
                ? {
                      ...vevent,
                      'x-pm-shared-event-id': { value: sharedEventID },
                      'x-pm-session-key': { value: sharedSessionKey },
                  }
                : vevent;
            const inviteIcs = createInviteIcs({
                method: ICAL_METHOD.REQUEST,
                prodId,
                vevent: pmVevent,
                vtimezones,
            });
            if (!hasAddedAttendees && !hasRemovedAttendees && attendees?.length) {
                // it's a new invitation
                const params = { method: ICAL_METHOD.REQUEST, vevent, isCreateEvent: true };
                await sendIcs({
                    method: ICAL_METHOD.REQUEST,
                    ics: inviteIcs,
                    addressID,
                    from,
                    to: getSafeSendTo(attendees, sendPreferencesMap),
                    subject: generateEmailSubject(params),
                    plainTextBody: generateEmailBody(params),
                    sendPreferencesMap,
                    contactEmailsMap,
                });
            } else {
                // it's an existing event, but we're just adding or removing participants
                const promises = [];
                if (addedAttendees?.length) {
                    const params = { method: ICAL_METHOD.REQUEST, vevent, isCreateEvent: true };
                    promises.push(
                        sendIcs({
                            method: ICAL_METHOD.REQUEST,
                            ics: inviteIcs,
                            addressID,
                            from,
                            to: getSafeSendTo(addedAttendees, sendPreferencesMap),
                            subject: generateEmailSubject(params),
                            plainTextBody: generateEmailBody(params),
                            sendPreferencesMap,
                            contactEmailsMap,
                        })
                    );
                }
                if (removedAttendees?.length) {
                    if (!cancelVevent) {
                        throw new Error('Cannot cancel invite ics without the old event component');
                    }
                    const cancelIcs = createInviteIcs({
                        method: ICAL_METHOD.CANCEL,
                        prodId,
                        vevent: cancelVevent,
                        attendeesTo: removedAttendees,
                        vtimezones,
                    });
                    const params = { method: ICAL_METHOD.CANCEL, vevent };
                    promises.push(
                        sendIcs({
                            method: ICAL_METHOD.CANCEL,
                            ics: cancelIcs,
                            addressID,
                            from,
                            to: getSafeSendTo(removedAttendees, sendPreferencesMap),
                            subject: generateEmailSubject(params),
                            plainTextBody: generateEmailBody(params),
                            sendPreferencesMap,
                            contactEmailsMap,
                        })
                    );
                }
                await Promise.all(promises);
            }
            return;
        } catch (e) {
            onRequestError(e);
        }
    }
    if (type === SEND_UPDATE) {
        try {
            if (!vevent) {
                throw new Error('Cannot build invite ics without the event component');
            }
            const { attendee: attendees } = vevent;
            if (!selfAddress) {
                throw new Error('Cannot build request ics without organizer and attendees');
            }
            if (!sharedEventID || !sharedSessionKey) {
                throw new Error('Missing shared event data');
            }
            const vtimezones = FEATURE_FLAGS.includes('use-vtimezones')
                ? await generateVtimezonesComponents(vevent, getVTimezonesMap)
                : [];
            const pmVevent = FEATURE_FLAGS.includes('proton-proton-invites')
                ? {
                      ...vevent,
                      'x-pm-shared-event-id': { value: sharedEventID },
                      'x-pm-session-key': { value: sharedSessionKey },
                  }
                : vevent;
            const inviteIcs = createInviteIcs({
                method: ICAL_METHOD.REQUEST,
                prodId,
                vevent: pmVevent,
                vtimezones,
            });
            const addedAttendeesEmails = (addedAttendees || []).map((attendee) => getAttendeeEmail(attendee));
            const remainingAttendees = (attendees || []).filter(
                (attendee) => !addedAttendeesEmails.includes(getAttendeeEmail(attendee))
            );
            const promises = [];
            if (remainingAttendees.length) {
                const params = { method: ICAL_METHOD.REQUEST, vevent, isCreateEvent: false };
                promises.push(
                    sendIcs({
                        method: ICAL_METHOD.REQUEST,
                        ics: inviteIcs,
                        addressID,
                        from,
                        to: getSafeSendTo(remainingAttendees, sendPreferencesMap),
                        subject: generateEmailSubject(params),
                        plainTextBody: generateEmailBody(params),
                        sendPreferencesMap,
                        contactEmailsMap,
                    })
                );
            }
            if (addedAttendees?.length) {
                const params = { method: ICAL_METHOD.REQUEST, vevent, isCreateEvent: true };
                promises.push(
                    sendIcs({
                        method: ICAL_METHOD.REQUEST,
                        ics: inviteIcs,
                        addressID,
                        from,
                        to: getSafeSendTo(addedAttendees, sendPreferencesMap),
                        subject: generateEmailSubject(params),
                        plainTextBody: generateEmailBody(params),
                        sendPreferencesMap,
                        contactEmailsMap,
                    })
                );
            }
            if (removedAttendees?.length) {
                if (!cancelVevent) {
                    throw new Error('Cannot cancel invite ics without the old event component');
                }
                const cancelIcs = createInviteIcs({
                    method: ICAL_METHOD.CANCEL,
                    prodId,
                    vevent: cancelVevent,
                    attendeesTo: removedAttendees,
                    vtimezones,
                });
                const params = { method: ICAL_METHOD.CANCEL, vevent: cancelVevent };
                promises.push(
                    sendIcs({
                        method: ICAL_METHOD.CANCEL,
                        ics: cancelIcs,
                        addressID,
                        from,
                        to: getSafeSendTo(removedAttendees, sendPreferencesMap),
                        subject: generateEmailSubject(params),
                        plainTextBody: generateEmailBody(params),
                        sendPreferencesMap,
                        contactEmailsMap,
                    })
                );
            }
            await Promise.all(promises);
            return;
        } catch (e) {
            onRequestError(e);
        }
    }
    if (type === CANCEL_INVITATION) {
        try {
            if (!cancelVevent) {
                throw new Error('Cannot cancel invite ics without the old event component');
            }
            const { attendee: attendees } = cancelVevent;
            if (!attendees?.length) {
                throw new Error('Cannot build cancel ics without attendees');
            }
            const vtimezones = FEATURE_FLAGS.includes('use-vtimezones')
                ? await generateVtimezonesComponents(cancelVevent, getVTimezonesMap)
                : [];
            const cancelIcs = createInviteIcs({
                method: ICAL_METHOD.CANCEL,
                prodId,
                vevent: cancelVevent,
                attendeesTo: attendees,
                vtimezones,
            });
            const params = { method: ICAL_METHOD.CANCEL, vevent: cancelVevent };
            await sendIcs({
                method: ICAL_METHOD.CANCEL,
                ics: cancelIcs,
                addressID,
                from,
                to: getSafeSendTo(attendees, sendPreferencesMap),
                subject: generateEmailSubject(params),
                plainTextBody: generateEmailBody(params),
                sendPreferencesMap,
                contactEmailsMap,
            });
        } catch (e) {
            onCancelError(e);
        }
    }
    if ([CHANGE_PARTSTAT, DECLINE_INVITATION].includes(type)) {
        try {
            if (!vevent) {
                throw new Error('Cannot build invite ics without the event component');
            }
            const { organizer } = vevent;
            if (selfAttendeeIndex === undefined || !vevent.attendee || !selfAddress || !organizer) {
                throw new Error('Missing invitation data');
            }
            const selfAttendee = vevent.attendee[selfAttendeeIndex];

            const organizerEmail = getAttendeeEmail(organizer);
            const selfAttendeeWithPartstat = {
                ...selfAttendee,
                parameters: {
                    ...selfAttendee.parameters,
                    partstat,
                },
            };
            const replyIcs = createInviteIcs({
                method: ICAL_METHOD.REPLY,
                prodId,
                vevent,
                attendeesTo: [selfAttendeeWithPartstat],
            });
            const displayName = selfAddress.DisplayName || selfAddress.Email;
            const params = {
                method: ICAL_METHOD.REPLY,
                vevent,
                partstat: getAttendeePartstat(selfAttendeeWithPartstat),
                emailAddress: getAttendeeEmail(selfAttendee),
            };
            await sendIcs({
                method: ICAL_METHOD.REPLY,
                ics: replyIcs,
                addressID: selfAddress.ID,
                from: {
                    Address: selfAddress.Email,
                    Name: displayName,
                },
                to: [{ Address: organizerEmail, Name: organizer.parameters?.cn || organizerEmail }],
                subject: generateEmailSubject(params),
                plainTextBody: generateEmailBody(params),
                sendPreferencesMap,
                contactEmailsMap,
            });
            return;
        } catch (e) {
            onReplyError(e);
        }
    }
};
