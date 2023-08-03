import { ADDRESS_FLAGS, ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS, ADDRESS_TYPE } from '../constants';
import { AddressKey } from './Key';
import { ActiveSignedKeyList, SignedKeyList } from './SignedKeyList';

export interface Address {
    DisplayName: string;
    DomainID: string;
    Email: string;
    HasKeys: number;
    ID: string;
    Keys: AddressKey[];
    SignedKeyList: ActiveSignedKeyList | null;
    Order: number;
    Priority: number;
    Receive: ADDRESS_RECEIVE;
    Send: ADDRESS_SEND;
    Signature: string;
    Status: ADDRESS_STATUS;
    Type: ADDRESS_TYPE;
    Flags?: ADDRESS_FLAGS;
    ProtonMX: boolean;
}

export interface DomainAddress extends Omit<Address, 'SignedKeyList' | 'Keys'> {
    CatchAll: 1 | 0;
}

export interface AddressKeyPayload {
    AddressID: string;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}

export interface AddressKeyPayloadV2 {
    AddressID: string;
    Token: string;
    Signature: string;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}

export interface Recipient {
    Name: string;
    Address: string;
    ContactID?: string;
    Group?: string;
    BimiSelector?: string | null;
    DisplaySenderImage?: number;
    IsProton?: number;
    IsSimpleLogin?: number;
}
