import { User } from '@proton/shared/lib/interfaces';

export function isBilledUser(user: User | undefined): boolean {
    if (!user) {
        return false;
    }

    return !!user.Billed;
}
