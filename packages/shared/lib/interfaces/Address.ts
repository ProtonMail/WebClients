import {
    ADDRESS_FLAGS,
    ADDRESS_RECEIVE,
    ADDRESS_SEND,
    ADDRESS_STATUS,
    ADDRESS_TYPE,
    EVENT_ACTIONS,
} from '../constants';
import { AddressKey } from './Key';
import { ActiveSignedKeyList, SignedKeyList } from './SignedKeyList';

export enum AddressConfirmationState {
    CONFIRMATION_NOT_CONFIRMED = 0,
    CONFIRMATION_CONFIRMED,
    CONFIRMATION_INVALID,
}

export interface Address {
    CatchAll: boolean;
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
    ConfirmationState: AddressConfirmationState;
    Permissions: number;
}

export type DomainAddress = Omit<Address, 'SignedKeyList' | 'Keys'>;

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

export interface AddressEvent {
    ID: string;
    Action: EVENT_ACTIONS;
    Address?: Address;
}
