import { getKeyFunction } from './KeysStatus';

describe('getKeyFunction', () => {
    const defaultStatus = {
        isAddressDisabled: false,
        isPrimary: false,
        isPrimaryFallback: false,
        isDecrypted: true,
        isCompromised: false,
        isObsolete: false,
        isLoading: false,
        isWeak: false,
        isForwarding: false,
    };

    it('primary key', () => {
        const keyFunction = getKeyFunction({
            ...defaultStatus,
            isPrimary: true,
            isPrimaryFallback: false,
        });

        expect(keyFunction.label).toEqual('Encryption, decryption, signing, verification');
    });

    it('primary key for compatibility', () => {
        const keyFunction = getKeyFunction({
            ...defaultStatus,
            isPrimary: true,
            isPrimaryFallback: true,
        });

        expect(keyFunction.label).toEqual('Encryption, decryption, signing, verification');
    });

    it('non-primary key', () => {
        const keyFunction = getKeyFunction({
            ...defaultStatus,
        });

        expect(keyFunction.label).toEqual('Decryption, verification');
    });

    it('obsolete key', () => {
        const keyFunction = getKeyFunction({
            ...defaultStatus,
            isObsolete: true,
        });

        expect(keyFunction.label).toEqual('Decryption, verification');
    });

    it('compromised key', () => {
        const keyFunction = getKeyFunction({
            ...defaultStatus,
            isObsolete: true,
            isCompromised: true,
        });

        expect(keyFunction.label).toEqual('Decryption');
    });

    it('forwarding key', () => {
        const keyFunction = getKeyFunction({
            ...defaultStatus,
            isForwarding: true,
        });

        expect(keyFunction.label).toEqual('Decryption');
    });

    it('inactive key', () => {
        const keyFunction = getKeyFunction({
            ...defaultStatus,
            isForwarding: true,
            isDecrypted: false,
        });

        expect(keyFunction.label).toEqual('—');
    });
});
