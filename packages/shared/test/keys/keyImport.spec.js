import { parseArmoredKeys, parseKeys } from '../../lib/keys/keyImport';

const VALID_KEY =
    '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: ProtonMail\nComment: https://protonmail.com\n\n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\nqxNXJd5vAkDBhT7GE3SynVm5htlqqP971VI=\n=1a6B\n-----END PGP PRIVATE KEY BLOCK-----';

const INVALID_KEY = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v4.2.2
Comment: https://openpgpjs.org

=twTO
-----END PGP PRIVATE KEY BLOCK-----`;

const KEY_DATA2 = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v4.2.2
Comment: https://openpgpjs.org

=
-----END PGP PRIVATE KEY BLOCK-----`;

describe('key import', () => {
    it('should parse key', () => {
        const parsedKeys = parseArmoredKeys(INVALID_KEY);
        expect(parsedKeys).toEqual([INVALID_KEY]);
    });

    it('should parse multiple keys', () => {
        const parsedKeys = parseArmoredKeys(`
            ${INVALID_KEY}
            
            random data
            foo
            ${KEY_DATA2}
        `);
        expect(parsedKeys).toEqual([INVALID_KEY, KEY_DATA2]);
    });

    it('should handle invalid keys', async () => {
        const parsedKeys = await parseKeys([INVALID_KEY]);
        expect(parsedKeys).toEqual([]);
    });

    it('should handle valid keys', async () => {
        const parsedKeys = await parseKeys([VALID_KEY]);
        expect(parsedKeys).toEqual([jasmine.any(Object)]);
    });
});
