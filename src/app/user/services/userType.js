import { PAID_ADMIN_ROLE, PAID_MEMBER_ROLE } from '../../constants';

const isPaid = ({ user }) => user.Subscribed & 1;
const isFree = ({ user }) => !(user.Subscribed & 1);
const isPaidAdmin = ({ user }) => !isFree({ user }) && user.Role === PAID_ADMIN_ROLE;
const isPaidMember = ({ user }) => !isFree({ user }) && user.Role === PAID_MEMBER_ROLE;
const isSubUser = ({ user }) => typeof user.OrganizationPrivateKey !== 'undefined';

/* @ngInject */
function userType(authentication) {
    return () => ({
        isAdmin: isPaidAdmin(authentication),
        isMember: isPaidMember(authentication),
        isFree: isFree(authentication),
        isPaid: isPaid(authentication),
        isSub: isSubUser(authentication)
    });
}
export default userType;
