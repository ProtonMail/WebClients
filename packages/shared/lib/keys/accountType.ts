import { PRODUCT_BIT } from '../constants';
import { hasBit } from '../helpers/bitset';
import type { User as tsUser } from '../interfaces';
import { UserType } from '../interfaces';
import { isAdmin, isPrivate, isSelf } from '../user/helpers';

export const getRequiresMailKeySetup = (user: tsUser | undefined) => {
    if (!user) {
        return false;
    }
    // The mail service product bit is used as a heuristic to determine if it's an account with addresses.
    // If it was a VPN account, services would be 4
    return (
        user.Type === UserType.PROTON &&
        !user.Keys.length &&
        (user.Services === 0 || hasBit(user.Services, PRODUCT_BIT.MAIL))
    );
};

export const getIsSSOAccount = (user: tsUser | undefined): user is tsUser => {
    return Boolean(user && user.Flags.sso);
};

export const getIsSSOVPNOnlyAccount = (user: tsUser | undefined) => {
    return getIsSSOAccount(user) && !user.Keys.length;
};

export const getIsGlobalSSOAccount = (user: tsUser | undefined) => {
    return getIsSSOAccount(user) && user.Keys.length > 0;
};

export const getIsVPNOnlyAccount = (user: tsUser | undefined) => {
    if (!user) {
        return false;
    }
    // The vpn service product bit is used as a heuristic to determine if it's an account without addresses
    // NOTE: For vpn and pass bundle, Services gets incorrectly set to 12 = 4 + Pass
    return (
        user.Type === UserType.PROTON &&
        !user.Keys.length &&
        hasBit(user.Services, PRODUCT_BIT.VPN) &&
        !hasBit(user.Services, PRODUCT_BIT.MAIL)
    );
};

export const getIsExternalAccount = (user: tsUser) => {
    if (!user) {
        return false;
    }
    return user.Type === UserType.EXTERNAL || user.Flags['no-proton-address'];
};

export const getCanSetupProtonAddress = (user: tsUser | undefined): boolean => {
    return Boolean(
        user &&
        // Is currently external
        getIsExternalAccount(user) &&
        // Managed users cannot create a Proton address.
        // The API checks for $user->isSubUser() -> `Proton Mail domain address creation is not allowed for this user`
        user.Type !== UserType.MANAGED &&
        // Impersonation not allowed
        isSelf(user) &&
        // This is a key setup check. Admins can create keys for non-private and private users. If not admin, it needs to be a private user to setup keys.
        (isAdmin(user) || isPrivate(user))
    );
};

export const getIsExternalUserWithoutProtonAddressCreation = (user: tsUser | undefined) => {
    return Boolean(user && getIsExternalAccount(user) && !getCanSetupProtonAddress(user));
};

export const getIsBYOEAccount = (user: tsUser) => {
    if (!user) {
        return false;
    }
    return user.Flags['has-a-byoe-address'];
};

export const getRequiresPasswordSetup = (user: tsUser, setupVPN: boolean) => {
    if (!user || user.Keys.length > 0 || !isPrivate(user)) {
        return false;
    }
    return getRequiresMailKeySetup(user) || (getIsVPNOnlyAccount(user) && setupVPN) || getIsExternalAccount(user);
};
