import { SignedKeyList } from '../interfaces';

export const setupMemberKeyRoute = ({
    MemberID,
    ...rest
}: {
    MemberID: string;
    AddressKeys: {
        AddressID: string;
        SignedKeyList: SignedKeyList;
        UserKey: string;
        MemberKey: string;
        Token: string;
    }[];
    KeySalt: string;
    PrimaryKey: {
        UserKey: string;
        MemberKey: string;
        Token: string;
    };
}) => ({
    url: `members/${MemberID}/keys/setup`,
    method: 'post',
    data: rest,
});

export const createMemberKeyRoute = ({
    MemberID,
    ...rest
}: {
    MemberID: string;
    Activation: string;
    Token: string;
    AddressID: string;
    UserKey: string;
    MemberKey: string;
    Primary: number;
    SignedKeyList: SignedKeyList;
}) => ({
    url: `members/${MemberID}/keys`,
    method: 'post',
    data: rest,
});
