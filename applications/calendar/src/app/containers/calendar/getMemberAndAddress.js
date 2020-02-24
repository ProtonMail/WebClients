const getMemberAndAddress = (Addresses = [], Members = [], Author = '') => {
    // First try to find self by author to use the same address.
    const selfAddress = Addresses.find((Address) => Address.Email === Author);
    const selfMember = Members.find((Member) => Member.Email === selfAddress.Email);

    if (selfMember && selfAddress) {
        return {
            Member: selfMember,
            Address: selfAddress
        };
    }

    // Otherwise just use the first member. It is assumed the list of members only contain yourself.
    const [defaultMember] = Members;
    const Address = Addresses.find((Address) => defaultMember.Email === Address.Email);
    if (!Address) {
        throw new Error('Self as member not found');
    }
    return {
        Member: defaultMember,
        Address
    };
};

export default getMemberAndAddress;
