import { addMinutes, fromUnixTime } from 'date-fns';

import { PRODUCT_BIT, UNPAID_STATE, USER_ROLES } from '../constants';
import { hasBit } from '../helpers/bitset';
import { decodeBase64URL } from '../helpers/encoding';
import type { User } from '../interfaces';

const { ADMIN_ROLE, MEMBER_ROLE, FREE_ROLE } = USER_ROLES;

export const hasPaidMail = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.MAIL);
export const hasPaidDrive = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.DRIVE);
export const hasPaidVpn = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.VPN);
export const hasPaidPass = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.PASS);
export const isPaid = (user: User) => !!user.Subscribed;
export const isPrivate = (user: User) => user.Private === 1;
export const isFree = (user: User) => !isPaid(user);
export const isAdmin = (user: User) => user.Role === ADMIN_ROLE;
export const isMember = (user: User) => user.Role === MEMBER_ROLE;
export const isSubUser = (user: User) => typeof user.OrganizationPrivateKey !== 'undefined';
export const isDelinquent = (user: User) => !!user.Delinquent;
export const getHasNonDelinquentScope = (user: User) => user.Delinquent < UNPAID_STATE.DELINQUENT;
export const canPay = (user: User) => [ADMIN_ROLE, FREE_ROLE].includes(user.Role) && !isSubUser(user);

export const getInfo = (User: User) => {
    return {
        isAdmin: isAdmin(User),
        isMember: isMember(User),
        isFree: isFree(User),
        isPaid: isPaid(User),
        isPrivate: isPrivate(User),
        isSubUser: isSubUser(User),
        isDelinquent: isDelinquent(User),
        hasNonDelinquentScope: getHasNonDelinquentScope(User),
        hasPaidMail: hasPaidMail(User),
        hasPaidVpn: hasPaidVpn(User),
        hasPaidDrive: hasPaidDrive(User),
        hasPaidPass: hasPaidPass(User),
        canPay: canPay(User),
    };
};

export const formatUser = (User: User) => {
    return {
        ...User,
        ...getInfo(User),
    };
};

export const getUserByte = (user: User) => {
    const userID = user?.ID || '';
    const byteCharacters = decodeBase64URL(userID);
    return byteCharacters.charCodeAt(0);
};

export const getUserAccountAge = (user: User) => {
    return fromUnixTime(user.CreateTime);
};

/**
 * Checks if a user is older than a specified number of minutes.
 * @param user - The user to check.
 * @param minutes - The number of minutes to compare against.
 * @returns `true` if the user is older than the specified number of minutes, `false` otherwise.
 */
export const isUserOlderThan = (user: User, minutes: number) => {
    return new Date() > addMinutes(getUserAccountAge(user), minutes);
};
