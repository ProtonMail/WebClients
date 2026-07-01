import { USER_ROLES } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import { UserType } from '@proton/shared/lib/interfaces';

export const enum TelemetryUserTier {
    internal = 'internal',
    paid = 'paid',
    free = 'free',
    nonUser = 'non_user',
}

/**
 * This function returns the "UserTier" needed for some telemetry tracking.
 * This UserTier is only being used for tracking purposes.
 * @param user: User
 * @returns TelemetryUserTier
 */
export const getTelemetryUserTier = (user: User): TelemetryUserTier => {
    if (user.Type === UserType.PROTON) {
        return TelemetryUserTier.internal;
    }

    switch (user.Role) {
        case USER_ROLES.ADMIN_ROLE:
        case USER_ROLES.MEMBER_ROLE:
            return TelemetryUserTier.paid;
        default:
            return TelemetryUserTier.free;
    }
};
