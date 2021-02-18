import { arrayToHexString, binaryStringToArray, unsafeSHA1 } from 'pmcrypto';
import { groupWith } from '../helpers/array';
import { buildMailTo, canonizeEmailByGuess, getEmailTo, validateEmailAddress } from '../helpers/email';
import { omit } from '../helpers/object';
import { GetCanonicalEmails } from '../interfaces';
import { Attendee } from '../interfaces/calendar';
import {
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalPmVeventComponent,
    VcalVeventComponent,
} from '../interfaces/calendar/VcalModel';
import { RequireSome, SimpleMap } from '../interfaces/utils';
import { ATTENDEE_PERMISSIONS, ATTENDEE_STATUS_API, ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from './constants';
import { getAttendeeHasToken, getAttendeesHaveToken } from './vcalHelper';

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

/**
 * Internally permissions are stored as x-pm-permissions in the vevent,
 * but stripped for the api.
 */
export const fromInternalAttendee = ({
    parameters: {
        'x-pm-permissions': oldPermissions = ATTENDEE_PERMISSIONS.SEE_AND_INVITE,
        'x-pm-token': token = '',
        partstat,
        ...restParameters
    } = {},
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
            permissions: oldPermissions,
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
                'x-pm-permissions': extra.Permissions,
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
        return {
            ...attendee,
            parameters: {
                ...attendee.parameters,
                partstat: partstatMap[email],
            },
        };
    });
};

export const getSupportedAttendee = (attendee: VcalAttendeeProperty) => {
    const {
        parameters: { cn, role, partstat, rsvp, 'x-pm-token': token, 'x-pm-permissions': permissions } = {},
    } = attendee;
    const emailAddress = getAttendeeEmail(attendee);
    const supportedAttendee: RequireSome<VcalAttendeeProperty, 'parameters'> = {
        value: buildMailTo(emailAddress),
        parameters: {
            cn: cn ?? emailAddress,
        },
    };
    const roleUpperCased = role?.toUpperCase();
    if (roleUpperCased === ICAL_ATTENDEE_ROLE.REQUIRED || roleUpperCased === ICAL_ATTENDEE_ROLE.OPTIONAL) {
        supportedAttendee.parameters.role = roleUpperCased;
    }
    if (rsvp?.toUpperCase() === 'TRUE') {
        supportedAttendee.parameters.rsvp = rsvp.toUpperCase();
    }
    if (partstat) {
        supportedAttendee.parameters.partstat = partstat.toUpperCase();
    }
    if (token) {
        supportedAttendee.parameters['x-pm-token'] = token;
    }
    if (permissions !== undefined) {
        supportedAttendee.parameters['x-pm-permissions'] = permissions;
    }
    return supportedAttendee;
};

export const withPmAttendees = async (
    vevent: VcalVeventComponent,
    getCanonicalEmails: GetCanonicalEmails
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
    const canonicalEmailMap = await getCanonicalEmails(emailsWithoutToken);

    const pmAttendees = await Promise.all(
        attendeesWithEmail.map(async ({ attendee, emailAddress }) => {
            const supportedAttendee = getSupportedAttendee(attendee);
            if (getAttendeeHasToken(supportedAttendee)) {
                return supportedAttendee;
            }
            const canonicalEmail = canonicalEmailMap[emailAddress];
            if (!canonicalEmail) {
                throw new Error('No canonical email provided');
            }
            const token = await generateAttendeeToken(canonicalEmail, uid.value);
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
