import { hasBit } from '../helpers/bitset';
import { CALENDAR_PERMISSIONS } from './constants';

export const findMemberAddressWithAdminPermissions = (Members, Addresses) => {
    const Member = Members.find(({ Email: MemberEmail, Permissions }) => {
        return hasBit(Permissions, CALENDAR_PERMISSIONS.ADMIN) && Addresses.find(({ Email }) => MemberEmail === Email);
    });
    const Address = Addresses.find(({ Email }) => Member.Email === Email);
    return {
        Member,
        Address
    };
};
