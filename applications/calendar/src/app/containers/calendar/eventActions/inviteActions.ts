import { SendIcsParams } from '@proton/components/hooks/useSendIcs';
import { PublicKeyReference } from '@proton/crypto';
import { getAttendeeEmail, getEquivalentAttendees, withPartstat } from '@proton/shared/lib/calendar/attendees';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import {
    createInviteIcs,
    generateEmailBody,
    generateEmailSubject,
    generateVtimezonesComponents,
    getHasUpdatedInviteData,
} from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getAttendeePartstat, getHasAttendees } from '@proton/shared/lib/calendar/vcalHelper';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { Recipient } from '@proton/shared/lib/interfaces';
import { VcalAttendeeProperty, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { GetVTimezonesMap } from '@proton/shared/lib/interfaces/hooks/GetVTimezonesMap';
import { RelocalizeText } from '@proton/shared/lib/interfaces/hooks/RelocalizeText';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { RequireSome, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { getSupportedPlusAlias } from '@proton/shared/lib/mail/addresses';
import unary from '@proton/utils/unary';

import { INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';
import { withIncrementedSequence } from './sequence';

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

type PmVcalVeventComponent = RequireSome<VcalVeventComponent, 'x-pm-shared-event-id' | 'x-pm-session-key'>;

interface EventInviteIcsAndPmVevent {
    pmVevent: PmVcalVeventComponent;
    eventInviteIcs: string;
}

interface CancelEventInviteIcsAndPmCancelVevent {
    pmCancelVevent: PmVcalVeventComponent;
    cancelEventInviteIcs: string;
}

type CreateInvitesReturn =
    | {}
    | EventInviteIcsAndPmVevent
    | CancelEventInviteIcsAndPmCancelVevent
    | (EventInviteIcsAndPmVevent & CancelEventInviteIcsAndPmCancelVevent);

const getAttendeesDiff = (newVevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    const normalizedNewEmails = (newVevent.attendee || []).map((attendee) =>
        canonicalizeEmailByGuess(getAttendeeEmail(attendee))
    );
    const normalizedOldEmails = (oldVevent.attendee || []).map((attendee) =>
        canonicalizeEmailByGuess(getAttendeeEmail(attendee))
    );
    const addedAttendees = newVevent.attendee?.filter((attendee) => {
        const normalizedNewEmail = canonicalizeEmailByGuess(getAttendeeEmail(attendee));
        return !normalizedOldEmails.includes(normalizedNewEmail);
    });
    const removedAttendees = oldVevent.attendee?.filter((attendee) => {
        const normalizedOldEmail = canonicalizeEmailByGuess(getAttendeeEmail(attendee));
        return !normalizedNewEmails.includes(normalizedOldEmail);
    });
    return { addedAttendees, removedAttendees };
};

export const getEquivalentAttendeesSend = (vevent: VcalVeventComponent, inviteActions: InviteActions) => {
    const { type, addedAttendees, removedAttendees } = inviteActions;
    // we only need to check for duplicates among the attendees newly added to the event
    if (type === INVITE_ACTION_TYPES.SEND_INVITATION) {
        if (!addedAttendees?.length && !removedAttendees?.length) {
            // it's a new invitation
            return getEquivalentAttendees(vevent.attendee);
        }
        if (addedAttendees?.length) {
            return getEquivalentAttendees(addedAttendees);
        }
    }
    if (type === INVITE_ACTION_TYPES.SEND_UPDATE) {
        return getEquivalentAttendees(vevent.attendee);
    }
};

const extractProtonAttendeePublicKey = (email: string, sendPreferencesMap: SimpleMap<SendPreferences>) => {
    const sendPreferences = sendPreferencesMap[email];
    if (!sendPreferences) {
        return;
    }
    const { publicKeys, hasApiKeys, error } = sendPreferences;
    if (!hasApiKeys) {
        // Not a Proton Attendee then
        return;
    }
    if (error) {
        // There should be no errors at this stage. Throwing just in case
        throw error;
    }
    if (!publicKeys?.length) {
        // This should not happen either. Throwing just in case
        throw new Error(`No public key for ${BRAND_NAME} attendee`);
    }
    return publicKeys[0];
};

const extractNewInvitedAttendeeEmails = (veventComponent: VcalVeventComponent, inviteActions: InviteActions) => {
    const { type, addedAttendees, removedAttendees } = inviteActions;
    if (type === INVITE_ACTION_TYPES.SEND_INVITATION) {
        if (addedAttendees?.length) {
            return addedAttendees.map(unary(getAttendeeEmail));
        }
        if (removedAttendees?.length) {
            // no new attendee is invited
            return [];
        }
        return (veventComponent.attendee || []).map(unary(getAttendeeEmail));
    }
    if (type === INVITE_ACTION_TYPES.SEND_UPDATE && addedAttendees?.length) {
        return addedAttendees.map(unary(getAttendeeEmail));
    }
    return [];
};

export const getAddedAttendeesPublicKeysMap = ({
    veventComponent,
    inviteActions,
    sendPreferencesMap,
}: {
    veventComponent: VcalVeventComponent;
    inviteActions: InviteActions;
    sendPreferencesMap: SimpleMap<SendPreferences>;
}) => {
    const addedAttendeesEmails = extractNewInvitedAttendeeEmails(veventComponent, inviteActions);
    return addedAttendeesEmails.reduce<SimpleMap<PublicKeyReference>>((acc, email) => {
        const publicKey = extractProtonAttendeePublicKey(email, sendPreferencesMap);
        if (!publicKey) {
            return acc;
        }
        acc[email] = publicKey;
        return acc;
    }, {});
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

export const createIcsInvites = async ({
    vevent,
    cancelVevent,
    eventAttendees,
    removedAttendees,
    sharedEventID,
    sharedSessionKey,
    prodId,
    getVTimezonesMap,
}: {
    vevent: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
    eventAttendees?: VcalAttendeeProperty[];
    removedAttendees?: VcalAttendeeProperty[];
    sharedEventID: string;
    sharedSessionKey: string;
    prodId: string;
    getVTimezonesMap: GetVTimezonesMap;
}): Promise<CreateInvitesReturn> => {
    const sharedFields = {
        'x-pm-shared-event-id': { value: sharedEventID },
        'x-pm-session-key': { value: sharedSessionKey },
    };

    const [eventInviteIcsAndPmVevent, cancelEventInviteIcsAndPmVeVent] = await Promise.all([
        eventAttendees?.length
            ? (() => {
                  const pmVevent = { ...vevent, ...sharedFields };

                  return generateVtimezonesComponents(vevent, getVTimezonesMap).then((vtimezones) => ({
                      pmVevent,
                      eventInviteIcs: createInviteIcs({
                          method: ICAL_METHOD.REQUEST,
                          prodId,
                          vevent: pmVevent,
                          vtimezones,
                          keepDtstamp: true,
                      }),
                  }));
              })()
            : undefined,
        removedAttendees?.length
            ? (() => {
                  if (!cancelVevent) {
                      throw new Error('Cannot generate cancel event invite');
                  }

                  const pmCancelVevent = { ...cancelVevent, ...sharedFields };
                  return generateVtimezonesComponents(cancelVevent, getVTimezonesMap).then((vtimezones) => ({
                      pmCancelVevent,
                      cancelEventInviteIcs: createInviteIcs({
                          method: ICAL_METHOD.CANCEL,
                          prodId,
                          vevent: pmCancelVevent,
                          vtimezones,
                          attendeesTo: removedAttendees,
                          keepDtstamp: true,
                      }),
                  }));
              })()
            : undefined,
    ]);

    return { ...eventInviteIcsAndPmVevent, ...cancelEventInviteIcsAndPmVeVent };
};

export const getSendIcsAction =
    ({
        vevent,
        cancelVevent,
        inviteActions,
        sendPreferencesMap,
        contactEmailsMap,
        prodId,
        inviteLocale,
        sendIcs,
        getVTimezonesMap,
        relocalizeText,
        onRequestError,
        onReplyError,
        onCancelError,
    }: {
        vevent?: VcalVeventComponent;
        cancelVevent?: VcalVeventComponent;
        inviteActions: InviteActions;
        sendPreferencesMap: SimpleMap<SendPreferences>;
        contactEmailsMap: SimpleMap<ContactEmail>;
        inviteLocale?: string;
        prodId: string;
        getVTimezonesMap: GetVTimezonesMap;
        relocalizeText: RelocalizeText;
        sendIcs: (params: SendIcsParams) => Promise<void>;
        onRequestError: (e: Error) => void;
        onReplyError: (e: Error) => void;
        onCancelError: (e: Error) => void;
    }) =>
    async () => {
        const {
            type,
            sharedEventID,
            sharedSessionKey,
            isProtonProtonInvite,
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

        // Attendee action
        if ([CHANGE_PARTSTAT, DECLINE_INVITATION].includes(type)) {
            try {
                if (!vevent) {
                    throw new Error('Cannot build invite ics without the event component');
                }
                const { organizer } = vevent;
                if (selfAttendeeIndex === undefined || !vevent.attendee || !selfAddress || !organizer) {
                    throw new Error('Missing invitation data');
                }
                const vtimezones = await generateVtimezonesComponents(vevent, getVTimezonesMap);
                const selfAttendee = vevent.attendee[selfAttendeeIndex];
                const supportedPlusAliasEmail = getSupportedPlusAlias({
                    selfAttendeeEmail: getAttendeeEmail(selfAttendee),
                    selfAddressEmail: selfAddress.Email,
                });

                const organizerEmail = getAttendeeEmail(organizer);
                const selfAttendeeWithPartstat = withPartstat(selfAttendee, partstat);
                const pmVevent = { ...vevent };
                if (isProtonProtonInvite) {
                    pmVevent['x-pm-proton-reply'] = { value: 'true', parameters: { type: 'boolean' } };
                }
                const replyIcs = createInviteIcs({
                    method: ICAL_METHOD.REPLY,
                    prodId,
                    vevent: pmVevent,
                    vtimezones,
                    attendeesTo: [selfAttendeeWithPartstat],
                    keepDtstamp: true,
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
                        Address: supportedPlusAliasEmail,
                        Name: displayName,
                    },
                    to: [{ Address: organizerEmail, Name: organizer.parameters?.cn || organizerEmail }],
                    subject: await relocalizeText({
                        getLocalizedText: () => generateEmailSubject(params),
                        newLocaleCode: inviteLocale,
                        relocalizeDateFormat: true,
                    }),
                    plainTextBody: await relocalizeText({
                        getLocalizedText: () => generateEmailBody(params),
                        newLocaleCode: inviteLocale,
                        relocalizeDateFormat: true,
                    }),
                    sendPreferencesMap,
                    contactEmailsMap,
                });
            } catch (e: any) {
                onReplyError(e);
            } finally {
                return;
            }
        }

        // Organizer cancelation
        if (type === CANCEL_INVITATION) {
            try {
                if (!sharedEventID) {
                    throw new Error('Missing shared event id');
                }

                if (!cancelVevent) {
                    throw new Error('Cannot cancel invite ics without the old event component');
                }

                const { attendee: attendees } = cancelVevent;
                if (!attendees?.length) {
                    throw new Error('Cannot build cancel ics without attendees');
                }
                const vtimezones = await generateVtimezonesComponents(cancelVevent, getVTimezonesMap);
                // According to the RFC, the sequence must be incremented in this case
                const pmCancelVevent = withIncrementedSequence({
                    ...cancelVevent,
                    'x-pm-shared-event-id': { value: sharedEventID },
                });
                const cancelIcs = createInviteIcs({
                    method: ICAL_METHOD.CANCEL,
                    prodId,
                    vevent: pmCancelVevent,
                    attendeesTo: attendees,
                    vtimezones,
                    keepDtstamp: true,
                });
                const params = { method: ICAL_METHOD.CANCEL, vevent: pmCancelVevent };
                await sendIcs({
                    method: ICAL_METHOD.CANCEL,
                    ics: cancelIcs,
                    addressID,
                    from,
                    to: getSafeSendTo(attendees, sendPreferencesMap),
                    subject: await relocalizeText({
                        getLocalizedText: () => generateEmailSubject(params),
                        newLocaleCode: inviteLocale,
                        relocalizeDateFormat: true,
                    }),
                    plainTextBody: await relocalizeText({
                        getLocalizedText: () => generateEmailBody(params),
                        newLocaleCode: inviteLocale,
                        relocalizeDateFormat: true,
                    }),
                    sendPreferencesMap,
                    contactEmailsMap,
                });
            } catch (e: any) {
                onCancelError(e);
            } finally {
                return;
            }
        }

        try {
            if (!sharedEventID) {
                throw new Error('Missing shared event id');
            }

            if (!vevent) {
                throw new Error('Cannot build invite ics without the event component');
            }

            if (!sharedSessionKey) {
                throw new Error('Missing shared event data');
            }

            const { attendee: attendees } = vevent;

            const eventInvites = await createIcsInvites({
                vevent,
                cancelVevent,
                eventAttendees: [...(attendees ?? []), ...(addedAttendees ?? [])],
                removedAttendees,
                sharedEventID,
                sharedSessionKey,
                prodId,
                getVTimezonesMap,
            });

            // Organizer actions
            if (type === SEND_INVITATION) {
                if (
                    !hasAddedAttendees &&
                    !hasRemovedAttendees &&
                    attendees?.length &&
                    'eventInviteIcs' in eventInvites // should be true if the other conditions in the if are fulfilled. Needed for TS
                ) {
                    const { pmVevent, eventInviteIcs } = eventInvites;

                    // it's a new invitation
                    const params = { method: ICAL_METHOD.REQUEST, vevent: pmVevent, isCreateEvent: true };
                    await sendIcs({
                        method: ICAL_METHOD.REQUEST,
                        ics: eventInviteIcs,
                        addressID,
                        from,
                        to: getSafeSendTo(attendees, sendPreferencesMap),
                        subject: await relocalizeText({
                            getLocalizedText: () => generateEmailSubject(params),
                            newLocaleCode: inviteLocale,
                            relocalizeDateFormat: true,
                        }),
                        plainTextBody: await relocalizeText({
                            getLocalizedText: () => generateEmailBody(params),
                            newLocaleCode: inviteLocale,
                            relocalizeDateFormat: true,
                        }),
                        sendPreferencesMap,
                        contactEmailsMap,
                    });
                } else {
                    // it's an existing event, but we're just adding or removing participants
                    const promises = [];
                    if ('eventInviteIcs' in eventInvites) {
                        const { pmVevent, eventInviteIcs } = eventInvites;

                        const params = { method: ICAL_METHOD.REQUEST, vevent: pmVevent, isCreateEvent: true };
                        promises.push(
                            sendIcs({
                                method: ICAL_METHOD.REQUEST,
                                ics: eventInviteIcs,
                                addressID,
                                from,
                                to: getSafeSendTo(addedAttendees as VcalAttendeeProperty[], sendPreferencesMap),
                                subject: await relocalizeText({
                                    getLocalizedText: () => generateEmailSubject(params),
                                    newLocaleCode: inviteLocale,
                                    relocalizeDateFormat: true,
                                }),
                                plainTextBody: await relocalizeText({
                                    getLocalizedText: () => generateEmailBody(params),
                                    newLocaleCode: inviteLocale,
                                    relocalizeDateFormat: true,
                                }),
                                sendPreferencesMap,
                                contactEmailsMap,
                            })
                        );
                    }
                    if ('cancelEventInviteIcs' in eventInvites) {
                        const { pmCancelVevent, cancelEventInviteIcs } = eventInvites;

                        const params = { method: ICAL_METHOD.CANCEL, vevent: pmCancelVevent };
                        promises.push(
                            sendIcs({
                                method: ICAL_METHOD.CANCEL,
                                ics: cancelEventInviteIcs,
                                addressID,
                                from,
                                to: getSafeSendTo(removedAttendees as VcalAttendeeProperty[], sendPreferencesMap),
                                subject: await relocalizeText({
                                    getLocalizedText: () => generateEmailSubject(params),
                                    newLocaleCode: inviteLocale,
                                    relocalizeDateFormat: true,
                                }),
                                plainTextBody: await relocalizeText({
                                    getLocalizedText: () => generateEmailBody(params),
                                    newLocaleCode: inviteLocale,
                                    relocalizeDateFormat: true,
                                }),
                                sendPreferencesMap,
                                contactEmailsMap,
                            })
                        );
                    }
                    await Promise.all(promises);
                }
                return;
            }

            if (type === SEND_UPDATE) {
                const addedAttendeesEmails = (addedAttendees || []).map((attendee) => getAttendeeEmail(attendee));
                const remainingAttendees = (attendees || []).filter(
                    (attendee) => !addedAttendeesEmails.includes(getAttendeeEmail(attendee))
                );
                const promises = [];
                if (
                    remainingAttendees.length &&
                    'eventInviteIcs' in eventInvites // should be true if remainingAttendees has >=1 item. Needed for TS
                ) {
                    const { pmVevent, eventInviteIcs } = eventInvites;

                    const params = { method: ICAL_METHOD.REQUEST, vevent: pmVevent, isCreateEvent: false };
                    promises.push(
                        sendIcs({
                            method: ICAL_METHOD.REQUEST,
                            ics: eventInviteIcs,
                            addressID,
                            from,
                            to: getSafeSendTo(remainingAttendees, sendPreferencesMap),
                            subject: await relocalizeText({
                                getLocalizedText: () => generateEmailSubject(params),
                                newLocaleCode: inviteLocale,
                                relocalizeDateFormat: true,
                            }),
                            plainTextBody: await relocalizeText({
                                getLocalizedText: () => generateEmailBody(params),
                                newLocaleCode: inviteLocale,
                                relocalizeDateFormat: true,
                            }),
                            sendPreferencesMap,
                            contactEmailsMap,
                        })
                    );
                }
                if (
                    addedAttendees?.length &&
                    'eventInviteIcs' in eventInvites // should be true if addedAttendees has >=1 item. Needed for TS
                ) {
                    const { pmVevent, eventInviteIcs } = eventInvites;

                    const params = { method: ICAL_METHOD.REQUEST, vevent: pmVevent, isCreateEvent: true };
                    promises.push(
                        sendIcs({
                            method: ICAL_METHOD.REQUEST,
                            ics: eventInviteIcs,
                            addressID,
                            from,
                            to: getSafeSendTo(addedAttendees, sendPreferencesMap),
                            subject: await relocalizeText({
                                getLocalizedText: () => generateEmailSubject(params),
                                newLocaleCode: inviteLocale,
                                relocalizeDateFormat: true,
                            }),
                            plainTextBody: await relocalizeText({
                                getLocalizedText: () => generateEmailBody(params),
                                newLocaleCode: inviteLocale,
                                relocalizeDateFormat: true,
                            }),
                            sendPreferencesMap,
                            contactEmailsMap,
                        })
                    );
                }
                if ('cancelEventInviteIcs' in eventInvites) {
                    const { cancelEventInviteIcs, pmCancelVevent } = eventInvites;

                    const params = { method: ICAL_METHOD.CANCEL, vevent: pmCancelVevent };
                    promises.push(
                        sendIcs({
                            method: ICAL_METHOD.CANCEL,
                            ics: cancelEventInviteIcs,
                            addressID,
                            from,
                            // removed attendees check is made in `createIcsInvites`
                            to: getSafeSendTo(removedAttendees as VcalAttendeeProperty[], sendPreferencesMap),
                            subject: await relocalizeText({
                                getLocalizedText: () => generateEmailSubject(params),
                                newLocaleCode: inviteLocale,
                                relocalizeDateFormat: true,
                            }),
                            plainTextBody: await relocalizeText({
                                getLocalizedText: () => generateEmailBody(params),
                                newLocaleCode: inviteLocale,
                                relocalizeDateFormat: true,
                            }),
                            sendPreferencesMap,
                            contactEmailsMap,
                        })
                    );
                }
                await Promise.all(promises);
                return;
            }
        } catch (e: any) {
            onRequestError(e);
        }
    };
