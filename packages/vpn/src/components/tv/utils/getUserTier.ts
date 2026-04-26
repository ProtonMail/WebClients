import { USER_ROLES } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import { UserType } from '@proton/shared/lib/interfaces';

export const enum UserTier {
    internal = 'internal',
    paid = 'paid',
    free = 'free',
    nonUser = 'non_user',
}

export const getUserTier = (user: User): UserTier => {
    if (user.Type === UserType.PROTON) {
        return UserTier.internal;
    }

    switch (user.Role) {
        case USER_ROLES.ADMIN_ROLE:
        case USER_ROLES.MEMBER_ROLE:
            return UserTier.paid;
        default:
            return UserTier.free;
    }
};
