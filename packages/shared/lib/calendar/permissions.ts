import { hasBit } from '../helpers/bitset';
import { CALENDAR_PERMISSIONS } from './constants';

const { SUPER_OWNER, OWNER, ADMIN, READ_MEMBER_LIST, WRITE, READ, AVAILABILITY } = CALENDAR_PERMISSIONS;

export const MEMBER_PERMISSIONS = {
    OWNS: SUPER_OWNER + OWNER + ADMIN + READ_MEMBER_LIST + WRITE + READ + AVAILABILITY,
    EDIT: WRITE + READ + AVAILABILITY,
    FULL_VIEW: READ + AVAILABILITY,
    LIMITED: AVAILABILITY,
};

export const getCanWrite = (permissions: CALENDAR_PERMISSIONS) => {
    return hasBit(permissions, WRITE);
};
