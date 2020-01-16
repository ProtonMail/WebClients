import { ADDRESS_TYPE } from '../constants';

export interface Address {
    DisplayName: string;
    DomainID: string;
    Email: string;
    HasKeys: number;
    ID: string;
    Keys: object[]; // TODO: Proper type
    Order: number;
    Priority: number;
    Receive: number;
    Send: number;
    Signature: string;
    Status: number;
    Type: ADDRESS_TYPE;
}
