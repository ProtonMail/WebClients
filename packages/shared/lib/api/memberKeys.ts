import { SignedKeyList } from '../interfaces';

interface SetupMemberKeyAddressKeyPayload {
    AddressID: string;
    SignedKeyList: SignedKeyList;
    UserKey: string;
    MemberKey: string;
    Token: string;
}

interface SetupMemberKeyUserKeyPayload {
    UserKey: string;
    MemberKey: string;
    Token: string;
}

interface SetupMemberKeyPayload {
    MemberID: string;
    AddressKeys: SetupMemberKeyAddressKeyPayload[];
    KeySalt: string;
    PrimaryKey: SetupMemberKeyUserKeyPayload;
}

interface SetupMemberKeyUserKeyPayloadV2 {
    PrivateKey: string;
    OrgPrivateKey: string;
    OrgToken: string;
}

interface SetupMemberKeyAddressKeyPayloadV2 {
    AddressID: string;
    PrivateKey: string;
    Token: string;
    Signature: string;
    OrgSignature: string;
    SignedKeyList: SignedKeyList;
}

interface SetupMemberKeyPayloadV2 {
    MemberID: string;
    AddressKeys: SetupMemberKeyAddressKeyPayloadV2[];
    KeySalt: string;
    UserKey: SetupMemberKeyUserKeyPayloadV2;
}

export const setupMemberKeyRoute = ({ MemberID, ...data }: SetupMemberKeyPayload | SetupMemberKeyPayloadV2) => ({
    url: `members/${MemberID}/keys/setup`,
    method: 'post',
    data,
});

interface CreateMemberKeyPayload {
    MemberID: string;
    Activation: string;
    Token: string;
    AddressID: string;
    UserKey: string;
    MemberKey: string;
    Primary: number;
    SignedKeyList: SignedKeyList;
}

interface CreateMemberKeyPayloadV2 extends Omit<CreateMemberKeyPayload, 'UserKey' | 'MemberKey' | 'Activation'> {
    Signature: string;
    OrgSignature: string;
    PrivateKey: string;
}

export const createMemberKeyRoute = ({ MemberID, ...data }: CreateMemberKeyPayload | CreateMemberKeyPayloadV2) => ({
    url: `members/${MemberID}/keys`,
    method: 'post',
    data,
});
