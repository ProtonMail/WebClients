import { PRODUCT_BIT, UNPAID_STATE, USER_ROLES } from '../constants';
import { hasBit } from '../helpers/bitset';
import { User } from '../interfaces';

const { ADMIN_ROLE, MEMBER_ROLE, FREE_ROLE } = USER_ROLES;

export const hasPaidMail = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.Mail);
export const hasPaidDrive = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.Drive);
export const hasPaidVpn = (user: User) => hasBit(user.Subscribed, PRODUCT_BIT.VPN);
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
        canPay: canPay(User),
    };
};
