import { Address as AddressInterface } from '../../interfaces';
import { Member as MemberInterface } from '../../interfaces/calendar';

const getMemberAndAddress = (
    Addresses: AddressInterface[] = [],
    Members: MemberInterface[] = [],
    Author = ''
): [MemberInterface, AddressInterface] => {
    if (!Members.length) {
        throw new Error('No members');
    }
    if (!Addresses.length) {
        throw new Error('No addresses');
    }

    // First try to find self by author to use the same address.
    const selfAddress = Addresses.find((Address) => Address.Email === Author);
    const selfMember = selfAddress ? Members.find((Member) => Member.Email === selfAddress.Email) : undefined;

    if (selfMember && selfAddress) {
        return [selfMember, selfAddress];
    }

    // Otherwise just use the first member. It is assumed the list of members only contain yourself.
    const [defaultMember] = Members;

    const Address = Addresses.find(({ Email }) => defaultMember.Email === Email);
    if (!Address) {
        throw new Error('Self as member not found');
    }
    return [defaultMember, Address];
};

export const getMemberAndAddressID = ([{ ID: memberID }, { ID: addressID }]: [MemberInterface, AddressInterface]) => [
    memberID,
    addressID,
];

export default getMemberAndAddress;
