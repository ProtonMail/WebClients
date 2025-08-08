import { differenceInDays, fromUnixTime } from 'date-fns';

import { getAccessType } from '../authentication/getAccessType';
import { PRODUCT_BIT, USER_ROLES } from '../constants';
import { hasBit } from '../helpers/bitset';
import { decodeBase64URL } from '../helpers/encoding';
import type { User, UserInfo } from '../interfaces';
import { UNPAID_STATE } from '../interfaces';

const { ADMIN_ROLE, MEMBER_ROLE, FREE_ROLE } = USER_ROLES;

export const hasPaidMail = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.MAIL);
export const hasPaidDrive = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.DRIVE);
export const hasPaidWallet = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.WALLET);
export const hasPaidVpn = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.VPN);
export const hasPassLifetime = (user: User) => !!user.Flags?.['pass-lifetime'];
export const hasPassViaSimpleLogin = (user: User) => !!user.Flags?.['pass-from-sl'];
export const hasPaidPass = (user: User) =>
    hasBit(user.Subscribed, PRODUCT_BIT.PASS) || hasPassLifetime(user) || hasPassViaSimpleLogin(user);
export const isPaid = (user: User) => !!user.Subscribed;
export const isPrivate = (user: User) => user.Private === 1;
export const isFree = (user: User) => !isPaid(user);
export const isAdmin = (user: User) => user.Role === ADMIN_ROLE;
export const isMember = (user: User) => user.Role === MEMBER_ROLE;
export const isSelf = (user: User) => !user.OrganizationPrivateKey && !user.Flags?.['delegated-access'];
export const isDelinquent = (user: User) => !!user.Delinquent;
export const getHasNonDelinquentScope = (user: User) => user.Delinquent < UNPAID_STATE.DELINQUENT;
export const canPay = (user: User) => [ADMIN_ROLE, FREE_ROLE].includes(user.Role) && isSelf(user);

export const getInfo = (User: User): UserInfo => {
    return {
        isAdmin: isAdmin(User),
        isMember: isMember(User),
        isFree: isFree(User),
        isPaid: isPaid(User),
        isPrivate: isPrivate(User),
        isSelf: isSelf(User),
        isDelinquent: isDelinquent(User),
        hasNonDelinquentScope: getHasNonDelinquentScope(User),
        hasPaidMail: hasPaidMail(User),
        hasPaidVpn: hasPaidVpn(User),
        hasPaidDrive: hasPaidDrive(User),
        hasPaidPass: hasPaidPass(User),
        hasPassLifetime: hasPassLifetime(User),
        accessType: getAccessType(User),
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

export const getUserCreationDate = (user: User) => {
    return fromUnixTime(user.CreateTime);
};

export const getUserDaysSinceCreation = (creationDate: Date) => {
    return differenceInDays(new Date(), creationDate);
};

/**
 * Checks if a user is older than a specified number of days.
 * @param user - The user to check.
 * @param days - The number of days to compare against.
 * @returns `true` if the user account is at least as old as the specified number of days.
 */
export const isUserAccountOlderThanOrEqualToDays = (user: User, days: number) => {
    return getUserDaysSinceCreation(getUserCreationDate(user)) >= days;
};
