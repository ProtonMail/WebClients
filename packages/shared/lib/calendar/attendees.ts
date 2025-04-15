import { CryptoProxy, type SessionKey } from '@proton/crypto';
import { arrayToHexString, binaryStringToArray } from '@proton/crypto/lib/utils';
import groupWith from '@proton/utils/groupWith';
import isTruthy from '@proton/utils/isTruthy';
import unary from '@proton/utils/unary';

import { CONTACT_NAME_MAX_LENGTH } from '../contacts/constants';
import { buildMailTo, canonicalizeEmailByGuess, getEmailTo, validateEmailAddress } from '../helpers/email';
import { omit } from '../helpers/object';
import { SentryCalendarInitiatives, traceInitiativeError } from '../helpers/sentry';
import { normalize, truncatePossiblyQuotedString } from '../helpers/string';
import type { VerificationPreferences } from '../interfaces/VerificationPreferences';
import type {
    Attendee,
    AttendeeModel,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalPmVeventComponent,
    VcalVeventComponent,
} from '../interfaces/calendar';
import type { GetCanonicalEmailsMap } from '../interfaces/hooks/GetCanonicalEmailsMap';
import type { RequireSome, SimpleMap } from '../interfaces/utils';
import {
    ATTENDEE_COMMENT_ENCRYPTION_TYPE,
    ATTENDEE_STATUS_API,
    ICAL_ATTENDEE_ROLE,
    ICAL_ATTENDEE_RSVP,
    ICAL_ATTENDEE_STATUS,
} from './constants';
import { getDecryptedRSVPComment } from './crypto/helpers';
import { escapeInvalidHtmlTags } from './sanitize';
import { getAttendeeHasToken, getAttendeePartstat, getAttendeesHaveToken } from './vcalHelper';

export const NO_CANONICAL_EMAIL_ERROR = 'No canonical email provided';

export const generateAttendeeToken = async (normalizedEmail: string, uid: string) => {
    const uidEmail = `${uid}${normalizedEmail}`;
    const byteArray = binaryStringToArray(uidEmail);
    const hash = await CryptoProxy.computeHash({ algorithm: 'unsafeSHA1', data: byteArray });
    return arrayToHexString(hash);
};

export const toApiPartstat = (partstat?: string) => {
    if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
        return ATTENDEE_STATUS_API.TENTATIVE;
    }
    if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
        return ATTENDEE_STATUS_API.ACCEPTED;
    }
    if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
        return ATTENDEE_STATUS_API.DECLINED;
    }
    return ATTENDEE_STATUS_API.NEEDS_ACTION;
};

export const toIcsPartstat = (partstat?: ATTENDEE_STATUS_API) => {
    if (partstat === ATTENDEE_STATUS_API.TENTATIVE) {
        return ICAL_ATTENDEE_STATUS.TENTATIVE;
    }
    if (partstat === ATTENDEE_STATUS_API.ACCEPTED) {
        return ICAL_ATTENDEE_STATUS.ACCEPTED;
    }
    if (partstat === ATTENDEE_STATUS_API.DECLINED) {
        return ICAL_ATTENDEE_STATUS.DECLINED;
    }
    return ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
};

export const fromInternalAttendee = ({
    parameters: { 'x-pm-token': token = '', partstat, ...restParameters } = {},
    ...rest
}: VcalAttendeeProperty) => {
    return {
        attendee: {
            parameters: {
                ...restParameters,
                'x-pm-token': token,
            },
            ...rest,
        },
        clear: {
            token,
            status: toApiPartstat(partstat),
        },
    };
};

export const toInternalAttendee = (
    { attendee: attendees = [] }: Pick<VcalVeventComponent, 'attendee'>,
    clear: Attendee[] = [],
    sharedSessionKey: SessionKey | undefined,
    eventUID: string,
    getAttendeeVerificationPreferences: (attendeeEmail: string) => Promise<VerificationPreferences>
): Promise<VcalAttendeeProperty>[] => {
    return attendees.map(async (attendee) => {
        if (!attendee.parameters) {
            return attendee;
        }

        const token = attendee.parameters['x-pm-token'];
        const extra = clear.find(({ Token }) => Token === token);
        if (!token || !extra) {
            return attendee;
        }

        let comment = extra.Comment?.Message;

        if (
            sharedSessionKey &&
            extra.Comment?.Message &&
            extra.Comment?.Type === ATTENDEE_COMMENT_ENCRYPTION_TYPE.ENCRYPTED_AND_SIGNED
        ) {
            const attendeeEmail = attendee.parameters.cn;

            if (!attendeeEmail) {
                return attendee;
            }

            try {
                const attendeeVerificationPreferences = await getAttendeeVerificationPreferences(attendeeEmail);
                const decryptedMessageResult = await getDecryptedRSVPComment({
                    attendeeVerificationPreferences,
                    encryptedMessage: extra.Comment.Message,
                    eventUID,
                    sharedSessionKey,
                });

                comment = decryptedMessageResult.data;
            } catch (e) {
                traceInitiativeError(SentryCalendarInitiatives.RSVP_NOTE, e);
                comment = undefined;
            }
        }

        const partstat = toIcsPartstat(extra.Status);

        const result = {
            ...attendee,
            parameters: {
                ...attendee.parameters,
                partstat,
            },
        };

        if (comment) {
            result.parameters['x-pm-comment'] = comment;
        }

        return result;
    });
};

export const getAttendeeEmail = (attendee: VcalAttendeeProperty | VcalOrganizerProperty) => {
    const { cn, email } = attendee.parameters || {};
    const emailTo = getEmailTo(attendee.value);
    if (validateEmailAddress(emailTo)) {
        return emailTo;
    }
    if (email && validateEmailAddress(email)) {
        return email;
    }
    if (cn && validateEmailAddress(cn)) {
        return cn;
    }
    return emailTo;
};

export const withPartstat = (attendee: VcalAttendeeProperty, partstat?: ICAL_ATTENDEE_STATUS) => ({
    ...attendee,
    parameters: {
        ...attendee.parameters,
        partstat,
    },
});

export const modifyAttendeesPartstat = (
    attendees: VcalAttendeeProperty[],
    partstatMap: SimpleMap<ICAL_ATTENDEE_STATUS>
) => {
    const emailsToModify = Object.keys(partstatMap);
    return attendees.map((attendee) => {
        const email = getAttendeeEmail(attendee);
        if (!emailsToModify.includes(email)) {
            return attendee;
        }
        return withPartstat(attendee, partstatMap[email]);
    });
};

export const getSupportedOrganizer = (organizer: VcalOrganizerProperty) => {
    const { parameters: { cn } = {} } = organizer;
    const emailAddress = getAttendeeEmail(organizer);
    const supportedOrganizer: RequireSome<VcalAttendeeProperty, 'parameters'> = {
        value: buildMailTo(emailAddress),
        parameters: {
            cn: truncatePossiblyQuotedString(cn ?? emailAddress, CONTACT_NAME_MAX_LENGTH),
        },
    };

    return supportedOrganizer;
};

export const getSupportedAttendee = (attendee: VcalAttendeeProperty) => {
    const { parameters: { cn, role, partstat, rsvp, 'x-pm-token': token, 'x-pm-comment': comment } = {} } = attendee;
    const emailAddress = getAttendeeEmail(attendee);
    const supportedAttendee: RequireSome<VcalAttendeeProperty, 'parameters'> = {
        value: buildMailTo(emailAddress),
        parameters: {
            cn: truncatePossiblyQuotedString(cn ?? emailAddress, CONTACT_NAME_MAX_LENGTH),
        },
    };
    const normalizedUppercasedRole = normalize(role).toUpperCase();

    if (
        normalizedUppercasedRole === ICAL_ATTENDEE_ROLE.REQUIRED ||
        normalizedUppercasedRole === ICAL_ATTENDEE_ROLE.OPTIONAL
    ) {
        supportedAttendee.parameters.role = normalizedUppercasedRole;
    }

    if (normalize(rsvp) === 'true') {
        supportedAttendee.parameters.rsvp = 'TRUE';
    }

    if (partstat) {
        supportedAttendee.parameters.partstat = getAttendeePartstat(attendee);
    }

    if (token?.length === 40) {
        supportedAttendee.parameters['x-pm-token'] = token;
    }

    if (comment) {
        supportedAttendee.parameters['x-pm-comment'] = escapeInvalidHtmlTags(comment);
    }

    return supportedAttendee;
};

export const getCanonicalEmails = async (
    attendees: VcalAttendeeProperty[] = [],
    getCanonicalEmailsMap: GetCanonicalEmailsMap
) => {
    return Object.values(await getCanonicalEmailsMap(attendees.map(unary(getAttendeeEmail)))).filter(isTruthy);
};

export const withPmAttendees = async (
    vevent: VcalVeventComponent,
    getCanonicalEmailsMap: GetCanonicalEmailsMap,
    ignoreErrors = false
): Promise<VcalPmVeventComponent> => {
    const { uid, attendee: vcalAttendee } = vevent;
    if (!vcalAttendee?.length) {
        return omit(vevent, ['attendee']);
    }
    const attendeesWithEmail = vcalAttendee.map((attendee) => {
        const emailAddress = getAttendeeEmail(attendee);
        return {
            attendee,
            emailAddress,
        };
    });
    const emailsWithoutToken = attendeesWithEmail
        .filter(({ attendee }) => !attendee.parameters?.['x-pm-token'])
        .map(({ emailAddress }) => emailAddress);
    const canonicalEmailMap = await getCanonicalEmailsMap(emailsWithoutToken);

    const pmAttendees = await Promise.all(
        attendeesWithEmail.map(async ({ attendee, emailAddress }) => {
            const supportedAttendee = getSupportedAttendee(attendee);
            if (getAttendeeHasToken(supportedAttendee)) {
                return supportedAttendee;
            }
            const canonicalEmail = canonicalEmailMap[emailAddress];
            if (!canonicalEmail && !ignoreErrors) {
                throw new Error(NO_CANONICAL_EMAIL_ERROR);
            }
            // If the participant has an invalid email and we ignore errors, we fall back to the provided email address
            const token = await generateAttendeeToken(canonicalEmail || emailAddress, uid.value);
            return {
                ...supportedAttendee,
                parameters: {
                    ...supportedAttendee.parameters,
                    'x-pm-token': token,
                },
            };
        })
    );
    return {
        ...vevent,
        attendee: pmAttendees,
    };
};

export const getEquivalentAttendees = (attendees?: VcalAttendeeProperty[]) => {
    if (!attendees?.length) {
        return;
    }
    if (getAttendeesHaveToken(attendees)) {
        const attendeesWithToken = attendees.map((attendee) => ({
            token: attendee.parameters['x-pm-token'],
            email: getAttendeeEmail(attendee),
        }));
        const equivalentAttendees = groupWith((a, b) => a.token === b.token, attendeesWithToken).map((group) =>
            group.map(({ email }) => email)
        );
        return equivalentAttendees.length < attendees.length
            ? equivalentAttendees.filter((group) => group.length > 1)
            : undefined;
    }
    // not all attendees have token, so we're gonna canonicalize emails and compare based on that
    const attendeesWithCanonicalEmail = attendees.map((attendee) => {
        const email = getAttendeeEmail(attendee);
        const canonicalEmail = canonicalizeEmailByGuess(email);
        return { email, canonicalEmail };
    });
    const equivalentAttendees = groupWith(
        (a, b) => a.canonicalEmail === b.canonicalEmail,
        attendeesWithCanonicalEmail
    ).map((group) => group.map(({ email }) => email));
    return equivalentAttendees.length < attendees.length
        ? equivalentAttendees.filter((group) => group.length > 1)
        : undefined;
};

const { REQUIRED } = ICAL_ATTENDEE_ROLE;
const { TRUE } = ICAL_ATTENDEE_RSVP;
const { NEEDS_ACTION } = ICAL_ATTENDEE_STATUS;

export const emailToAttendee = (email: string): AttendeeModel => ({
    email,
    cn: email,
    role: REQUIRED,
    partstat: NEEDS_ACTION,
    rsvp: TRUE,
});
