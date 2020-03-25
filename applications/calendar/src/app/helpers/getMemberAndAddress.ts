import { Address as AddressInterface } from 'proton-shared/lib/interfaces';
import { Member as MemberInterface } from 'proton-shared/lib/interfaces/calendar';

const getMemberAndAddress = (Addresses: AddressInterface[] = [], Members: MemberInterface[] = [], Author = '') => {
    // First try to find self by author to use the same address.
    const selfAddress = Addresses.find((Address) => Address.Email === Author) || { Email: '' };
    const selfMember = Members.find((Member) => Member.Email === selfAddress.Email);

    if (selfMember && selfAddress) {
        return {
            Member: selfMember,
            Address: selfAddress
        };
    }

    // Otherwise just use the first member. It is assumed the list of members only contain yourself.
    const [defaultMember] = Members;
    const Address = Addresses.find(({ Email }) => defaultMember.Email === Email);
    if (!Address) {
        throw new Error('Self as member not found');
    }
    return {
        Member: defaultMember,
        Address
    };
};

export default getMemberAndAddress;
