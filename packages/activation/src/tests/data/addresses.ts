import { ADDRESS_FLAGS, type ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { Address, AddressKey } from '@proton/shared/lib/interfaces';

const activeKey: AddressKey = {
    ID: 'key',
    Primary: 1,
    Active: 1,
    Fingerprint: 'fingerprint',
    Fingerprints: [],
    Version: 1,
    PrivateKey: 'PrivateKey',
    Signature: 'signature',
    RecoverySecret: null,
    RecoverySecretSignature: null,
    Flags: 1,
    AddressForwardingID: 'AddressForwardingID',
};

const disabledKey: AddressKey = {
    ...activeKey,
    Active: 0,
};

export const generateMockAddress = (
    n: number,
    keyActive: boolean,
    type?: ADDRESS_TYPE,
    isBYOEAddress?: boolean
): Address => {
    return {
        DisplayName: `Testing ${n}`,
        DomainID: 'proton.ch',
        Email: `testing${n}@proton.ch`,
        HasKeys: 1,
        ID: `ID-${n}`,
        Keys: [keyActive ? activeKey : disabledKey],
        SignedKeyList: null,
        Order: 1,
        Priority: 1,
        Receive: 1,
        Send: 1,
        Permissions: 0,
        Signature: 'Testing signature',
        Status: 1,
        Type: type ?? 1,
        ProtonMX: true,
        ConfirmationState: 1,
        CatchAll: false,
        Flags: isBYOEAddress ? ADDRESS_FLAGS.BYOE : undefined,
    };
};

export const generateMockAddressArray = (n: number, keyActive: boolean, type?: ADDRESS_TYPE) => {
    return Array.from(Array(n)).map((_, i) => generateMockAddress(i, keyActive, type));
};
