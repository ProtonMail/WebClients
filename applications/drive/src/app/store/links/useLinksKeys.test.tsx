import { LinksKeys } from './useLinksKeys';

describe('useLinksKeys', () => {
    let keys: LinksKeys;

    beforeEach(() => {
        keys = new LinksKeys();
    });

    it('returns empty passphrase when not set', () => {
        keys.setPassphrase('shareId', 'linkId', 'pass');
        expect(keys.getPassphrase('shareId', 'missingLinkId')).toBe(undefined);
    });

    it('returns the cached passphrase', () => {
        keys.setPassphrase('shareId', 'linkId', 'pass');
        expect(keys.getPassphrase('shareId', 'linkId')).toBe('pass');
    });

    it('setting another key for the same link does not remove the other key', () => {
        keys.setPassphrase('shareId', 'linkId', 'pass');
        keys.setHashKey('shareId', 'linkId', 'hash');
        expect(keys.getPassphrase('shareId', 'linkId')).toBe('pass');
        expect(keys.getHashKey('shareId', 'linkId')).toBe('hash');
    });

    it('setting the key again overrides the original value', () => {
        keys.setPassphrase('shareId', 'linkId', 'pass');
        keys.setPassphrase('shareId', 'linkId', 'newpass');
        expect(keys.getPassphrase('shareId', 'linkId')).toBe('newpass');
    });
});
