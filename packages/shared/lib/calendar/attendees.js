import getRandomValues from 'get-random-values';
import { serializeUint8Array } from '../helpers/serialization';

export const PERMISSIONS_SEE_ATTENDEES = 1;
export const PERMISSIONS_INVITE = 2;
export const PERMISSIONS_EDIT = 4;
export const PERMISSIONS_DELETE = 8;

const generateAttendeeToken = () => {
    const value = getRandomValues(new Uint8Array(128));
    return serializeUint8Array(value);
};

/**
 * Internally permissions are stored as x-pm-permissions in the vevent,
 * but stripped for the api.
 * @type any
 */
export const fromInternalAttendee = ({
    parameters: {
        'x-pm-permissions': oldPermissions = PERMISSIONS_SEE_ATTENDEES,
        'x-pm-token': oldToken,
        ...restParameters
    } = {},
    ...rest
}) => {
    const token = oldToken || generateAttendeeToken();
    return {
        attendee: {
            parameters: {
                ...restParameters,
                'x-pm-token': token
            },
            ...rest
        },
        clear: {
            permissions: oldPermissions,
            token
        }
    };
};

/**
 * @param {Object} attendees
 * @param {Array} clear
 * @returns {Object}
 */
export const toInternalAttendee = ({ attendee: attendees = [] }, clear = []) => {
    return {
        attendee: attendees.map((attendee) => {
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
                    'x-pm-permissions': extra.Permissions
                }
            };
        })
    };
};
