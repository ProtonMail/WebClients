import type { User } from '../interfaces/User';
import { AccessType } from './accessType';

export const getAccessType = (user: User) => {
    if (user.OrganizationPrivateKey) {
        return AccessType.AdminAccess;
    }
    if (user.Flags?.['delegated-access']) {
        return AccessType.EmergencyAccess;
    }
    return AccessType.Self;
};
