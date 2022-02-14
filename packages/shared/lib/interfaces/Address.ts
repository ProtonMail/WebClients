import { ADDRESS_TYPE } from '../constants';
import { Key } from './Key';
import { SignedKeyListEpochs } from './SignedKeyList';
import { RequireSome } from './utils';

export interface Address {
    DisplayName: string;
    DomainID: string;
    Email: string;
    HasKeys: number;
    ID: string;
    Keys: RequireSome<Key, 'Flags'>[];
    SignedKeyList: SignedKeyListEpochs | null;
    Order: number;
    Priority: number;
    Receive: number;
    Send: number;
    Signature: string;
    Status: number;
    Type: ADDRESS_TYPE;
}

export interface AddressKeyPayload {
    AddressID: string;
    PrivateKey: string;
    SignedKeyList: {
        Data: string;
        Signature: string;
    };
}

export interface AddressKeyPayloadV2 {
    AddressID: string;
    Token: string;
    Signature: string;
    PrivateKey: string;
    SignedKeyList: {
        Data: string;
        Signature: string;
    };
}

export interface Recipient {
    Name: string;
    Address: string;
    ContactID?: string;
    Group?: string;
}
