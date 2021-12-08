import { SharesKeysStorage } from './useSharesKeys';

describe('useSharesKeys', () => {
    let keys: SharesKeysStorage;

    beforeEach(() => {
        keys = new SharesKeysStorage();
    });

    it('returns empty passphrase when not set', () => {
        // @ts-ignore: We simplify types in tests, so we don't have to construct OpenPGP key.
        keys.set('shareId', 'pk', 'sk');
        const passphrase = keys.get('missingShareId');
        expect(passphrase).toBe(undefined);
    });

    it('returns the cached passphrase', () => {
        // @ts-ignore: We simplify types in tests, so we don't have to construct OpenPGP key.
        keys.set('shareId', 'pk', 'sk');
        const passphrase = keys.get('shareId');
        expect(passphrase).toMatchObject({
            privateKey: 'pk',
            sessionKey: 'sk',
        });
    });
});
