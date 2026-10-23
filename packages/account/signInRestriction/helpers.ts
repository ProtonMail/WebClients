import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { type User, UserType } from '@proton/shared/lib/interfaces/User';
import { LOGIN_IDENTIFIER_POLICY } from '@proton/shared/lib/interfaces/UserSettings';

export const getSignInIdentifiers = (user: User, addresses: Address[] = []) => {
    return {
        username: user.Name,
        primaryEmail: addresses.find(getIsAddressEnabled)?.Email,
    };
};

// The API treats an empty mask as All
export const getIsSignInRestricted = (loginIdentifierPolicy: number) => {
    return loginIdentifierPolicy !== 0 && !hasBit(loginIdentifierPolicy, LOGIN_IDENTIFIER_POLICY.ALL);
};

export const getCanShowSignInRestriction = ({ user, addresses }: { user: User; addresses?: Address[] }) => {
    if (user.Type !== UserType.PROTON) {
        return false;
    }
    const { username, primaryEmail } = getSignInIdentifiers(user, addresses);
    return Boolean(username || primaryEmail);
};
