import { ADDRESS_TYPE } from '../constants';
import { Key } from './Key';

export interface Address {
    DisplayName: string;
    DomainID: string;
    Email: string;
    HasKeys: number;
    ID: string;
    Keys: Key[];
    Order: number;
    Priority: number;
    Receive: number;
    Send: number;
    Signature: string;
    Status: number;
    Type: ADDRESS_TYPE;
}

export interface AddressKey {
    AddressID: string;
    PrivateKey: string;
    SignedKeyList: {
        Data: string;
        Signature: string;
    };
}
