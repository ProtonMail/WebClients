import getRandomValues from 'get-random-values';
import { serializeUint8Array } from '../helpers/serialization';
import { Attendee } from '../interfaces/calendar';
import { VcalAttendeeProperty, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { ATTENDEE_PERMISSIONS } from './constants';

const generateAttendeeToken = () => {
    // we need a random base64 string with 40 characters
    const value = getRandomValues(new Uint8Array(30));
    return serializeUint8Array(value);
};

/**
 * Internally permissions are stored as x-pm-permissions in the vevent, but stripped for the api.
 */
export const fromInternalAttendee = ({
    parameters: {
        'x-pm-permissions': oldPermissions = ATTENDEE_PERMISSIONS.SEE,
        'x-pm-token': oldToken = '',
        ...restParameters
    } = {},
    ...rest
}: VcalAttendeeProperty) => {
    const token = oldToken || generateAttendeeToken();
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
        return {
            ...attendee,
            parameters: {
                ...attendee.parameters,
                'x-pm-permissions': extra.Permissions,
            },
        };
    });
};
