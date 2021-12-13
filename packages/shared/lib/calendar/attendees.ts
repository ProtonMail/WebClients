import { arrayToHexString, binaryStringToArray, unsafeSHA1 } from 'pmcrypto';

import { groupWith } from '../helpers/array';
import { buildMailTo, canonizeEmailByGuess, getEmailTo, validateEmailAddress } from '../helpers/email';
import { unary } from '../helpers/function';
import isTruthy from '../helpers/isTruthy';
import { omit } from '../helpers/object';
import { GetCanonicalEmailsMap } from '../interfaces/hooks/GetCanonicalEmailsMap';
import {
    Attendee,
    AttendeeModel,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalPmVeventComponent,
    VcalVeventComponent,
} from '../interfaces/calendar';
import { RequireSome, SimpleMap } from '../interfaces/utils';
import { ATTENDEE_STATUS_API, ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from './constants';
import { getAttendeeHasToken, getAttendeePartstat, getAttendeesHaveToken } from './vcalHelper';
import { normalize, truncatePossiblyQuotedString } from '../helpers/string';
import { CONTACT_NAME_MAX_LENGTH } from '../contacts/constants';

export const generateAttendeeToken = async (normalizedEmail: string, uid: string) => {
    const uidEmail = `${uid}${normalizedEmail}`;
    const byteArray = binaryStringToArray(uidEmail);
    const hash = await unsafeSHA1(byteArray);
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
    clear: Attendee[] = []
): VcalAttendeeProperty[] => {
    return attendees.map((attendee) => {
        if (!attendee.parameters) {
            return attendee;
        }
        const token = attendee.parameters['x-pm-token'];
        const extra = clear.find(({ Token }) => Token === token);
        if (!token || !extra) {
            return attendee;
        }
        const partstat = toIcsPartstat(extra.Status);
        return {
            ...attendee,
            parameters: {
                ...attendee.parameters,
                partstat,
            },
        };
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
    const { parameters: { cn, role, partstat, rsvp, 'x-pm-token': token } = {} } = attendee;
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
                throw new Error('No canonical email provided');
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

export const getDuplicateAttendees = (attendees?: VcalAttendeeProperty[]) => {
    if (!attendees?.length) {
        return;
    }
    if (getAttendeesHaveToken(attendees)) {
        const attendeesWithToken = attendees.map((attendee) => ({
            token: attendee.parameters['x-pm-token'],
            email: getAttendeeEmail(attendee),
        }));
        const duplicateAttendees = groupWith((a, b) => a.token === b.token, attendeesWithToken).map((group) =>
            group.map(({ email }) => email)
        );
        return duplicateAttendees.length < attendees.length
            ? duplicateAttendees.filter((group) => group.length > 1)
            : undefined;
    }
    // not all attendees have token, so we're gonna canonize emails and compare based on that
    const attendeesWithCanonicalEmail = attendees.map((attendee) => {
        const email = getAttendeeEmail(attendee);
        const canonicalEmail = canonizeEmailByGuess(email);
        return { email, canonicalEmail };
    });
    const duplicateAttendees = groupWith(
        (a, b) => a.canonicalEmail === b.canonicalEmail,
        attendeesWithCanonicalEmail
    ).map((group) => group.map(({ email }) => email));
    return duplicateAttendees.length < attendees.length
        ? duplicateAttendees.filter((group) => group.length > 1)
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
