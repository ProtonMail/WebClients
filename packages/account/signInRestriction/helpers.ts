import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { getPrimaryAddress } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { type Address, LOGIN_IDENTIFIER_POLICY, type User, UserType } from '@proton/shared/lib/interfaces';

export const getSignInIdentifiers = (user: User, addresses: Address[] = []) => {
    return {
        username: user.Name,
        primaryEmail: getPrimaryAddress(addresses)?.Email,
    };
};

// The API treats an empty mask as All
export const getIsSignInRestricted = (loginIdentifierPolicy: number) => {
    return loginIdentifierPolicy !== 0 && !hasBit(loginIdentifierPolicy, LOGIN_IDENTIFIER_POLICY.ALL);
};

export const getCanShowSignInRestriction = ({
    user,
    entitlements,
}: {
    user: User;
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'isB2B'>;
}) => {
    if (entitlements.isB2B || user.Type !== UserType.PROTON) {
        return false;
    }
    return Boolean(user.Name);
};
