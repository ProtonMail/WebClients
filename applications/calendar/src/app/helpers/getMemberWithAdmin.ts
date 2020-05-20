import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { CALENDAR_PERMISSIONS } from 'proton-shared/lib/calendar/constants';
import { Address as AddressInterface } from 'proton-shared/lib/interfaces';
import { Member as MemberInterface } from 'proton-shared/lib/interfaces/calendar';

export const getMemberAddressWithAdminPermissions = (Members: MemberInterface[], Addresses: AddressInterface[]) => {
    const Member = Members.find(({ Email: MemberEmail, Permissions }) => {
        return hasBit(Permissions, CALENDAR_PERMISSIONS.ADMIN) && Addresses.find(({ Email }) => MemberEmail === Email);
    });
    if (!Member) {
        throw new Error('Member with admin permission not found');
    }
    const Address = Addresses.find(({ Email }) => Member.Email === Email);
    if (!Address) {
        throw new Error('Address for member not found');
    }
    return {
        Member,
        Address,
    };
};
