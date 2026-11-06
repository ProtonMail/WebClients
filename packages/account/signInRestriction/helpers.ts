import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { type User, UserType } from '@proton/shared/lib/interfaces/User';
import { LOGIN_IDENTIFIER_POLICY } from '@proton/shared/lib/interfaces/UserSettings';
import { getIsSSOAccount } from '@proton/shared/lib/keys/accountType';

const SIGN_IN_DOMAINS = ['proton.me', 'protonmail.com', 'protonmail.ch'];

export const getSignInIdentifiers = (user: User, addresses: Address[] = []) => {
    const enabledOriginalAddresses = addresses.filter(
        (address) => address.Type === ADDRESS_TYPE.TYPE_ORIGINAL && getIsAddressEnabled(address)
    );
    const enabledOriginalDomains = new Set(
        enabledOriginalAddresses.map((address) => getEmailParts(address.Email)[1].toLowerCase())
    );

    return {
        username: user.Name,
        primaryEmail: enabledOriginalAddresses[0]?.Email,
        signInDomains: SIGN_IN_DOMAINS.filter((domain) => enabledOriginalDomains.has(domain)),
    };
};

// The API treats an empty mask as All
export const getIsSignInRestricted = (loginIdentifierPolicy: number) => {
    return loginIdentifierPolicy !== 0 && !hasBit(loginIdentifierPolicy, LOGIN_IDENTIFIER_POLICY.ALL);
};

export const getCanShowSignInRestriction = ({ user, addresses }: { user: User; addresses?: Address[] }) => {
    if (user.Type !== UserType.PROTON || getIsSSOAccount(user) || addresses?.length === 1) {
        return false;
    }
    const { username, primaryEmail } = getSignInIdentifiers(user, addresses);
    return Boolean(username || primaryEmail);
};
