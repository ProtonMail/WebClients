import { binaryStringToArray, unsafeSHA1, arrayToHexString } from 'pmcrypto';
import { API_CODES } from '../constants';
import { getEmailTo } from '../helpers/email';
import { Attendee, GetCanonicalAddressesResponse } from '../interfaces/calendar';
import { VcalAttendeeProperty, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { ATTENDEE_STATUS_API, ICAL_ATTENDEE_STATUS, ATTENDEE_PERMISSIONS } from './constants';
import { getCanonicalAddresses } from '../api/addresses';
import { Api } from '../interfaces';

export const generateAttendeeToken = async (normalizedEmail: string, uid: string) => {
    const uidEmail = `${uid}${normalizedEmail}`;
    const byteArray = binaryStringToArray(uidEmail);
    const hash = await unsafeSHA1(byteArray);
    return arrayToHexString(hash);
};

const toApiPartstat = (partstat?: string) => {
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

const toIcsPartstat = (partstat?: ATTENDEE_STATUS_API) => {
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

export const withPmAttendees = async (vevent: VcalVeventComponent, api: Api): Promise<VcalVeventComponent> => {
    const { uid, attendee: vcalAttendee } = vevent;
    if (!vcalAttendee?.length) {
        return { ...vevent };
    }
    const attendeesWithEmail = vcalAttendee.map((attendee) => {
        const emailAddress = getEmailTo(attendee.value);
        return {
            attendee,
            emailAddress,
        };
    });
    const { Responses, Code } = await api<GetCanonicalAddressesResponse>(
        getCanonicalAddresses(attendeesWithEmail.map(({ emailAddress }) => emailAddress))
    );
    const unexpectedResponse = Responses.some(({ Response }) => Response.Code !== API_CODES.SINGLE_SUCCESS);
    if (Code !== API_CODES.GLOBAL_SUCCESS || unexpectedResponse) {
        throw new Error('Canonize operation failed');
    }
    const pmAttendees = await Promise.all(
        attendeesWithEmail.map(async ({ attendee: { parameters, ...rest }, emailAddress }) => {
            const attendeeWithCn = {
                ...rest,
                parameters: {
                    ...parameters,
                    cn: parameters?.cn || emailAddress,
                },
            };
            if (parameters?.['x-pm-token']) {
                return { ...attendeeWithCn };
            }
            const token = await generateAttendeeToken(emailAddress, uid.value);
            return {
                ...attendeeWithCn,
                parameters: {
                    ...attendeeWithCn.parameters,
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
