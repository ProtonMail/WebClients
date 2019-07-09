export const setupMemberKeyRoute = ({ MemberID, AddressKeys, KeySalt, PrimaryKey }) => ({
    url: `members/${MemberID}/keys/setup`,
    method: 'post',
    data: {
        AddressKeys,
        KeySalt,
        PrimaryKey
    }
});

export const createMemberKeyRoute = ({
    MemberID,
    Activation,
    Token,
    AddressID,
    UserKey,
    MemberKey,
    Primary,
    SignedKeyList
}) => ({
    url: `members/${MemberID}/keys`,
    method: 'post',
    data: {
        Activation,
        Token,
        AddressID,
        UserKey,
        MemberKey,
        Primary,
        SignedKeyList
    }
});
