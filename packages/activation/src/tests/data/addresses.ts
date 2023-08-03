import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { AddressKey } from '@proton/shared/lib/interfaces';

const activeKey: AddressKey = {
    ID: 'key',
    Primary: 1,
    Active: 1,
    Fingerprint: 'fingerprint',
    Fingerprints: [],
    PublicKey: 'PublicKey',
    Version: 1,
    PrivateKey: 'PrivateKey',
    Signature: 'signature',
    RecoverySecret: null,
    RecoverySecretSignature: null,
    Flags: 1,
};

const disabledKey: AddressKey = {
    ...activeKey,
    Active: 0,
};

export const generateMockAddress = (n: number, keyActive: boolean, type?: ADDRESS_TYPE) => {
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
        Signature: 'Testing signature',
        Status: 1,
        Type: type ?? 1,
        ProtonMX: true,
    };
};

export const generateMockAddressArray = (n: number, keyActive: boolean, type?: ADDRESS_TYPE) => {
    return Array.from(Array(n)).map((_, i) => generateMockAddress(i, keyActive, type));
};
