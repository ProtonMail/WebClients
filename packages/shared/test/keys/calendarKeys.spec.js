import { decryptPrivateKey } from 'pmcrypto';

import { DecryptableKey } from './keys.data';
import { decryptPassphrase } from '../../lib/keys/calendarKeys';

const armoredPassphrase = `
-----BEGIN PGP MESSAGE-----
Version: ProtonMail
Comment: https://protonmail.com

wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09
yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17
aBbI/rBs0mQB8pECtS5Mmdeh+pBh0SN5j5TqWLagXatVn37yRtct0OvyFF6j
AoQtEASjLelCBOAtK3amaYeZ5mGdSOcybtepGeTcyM0zf+Y2KuzIxROpaymt
m2jIMVyDowE7kRwDxVX7XvSq
=9bP1
-----END PGP MESSAGE-----
`.trim();

const armoredSignature = `
-----BEGIN PGP SIGNATURE-----
Version: OpenPGP.js v4.5.5
Comment: https://openpgpjs.org

wl4EARYKAAYFAl1JPxQACgkQuDHP9BZVsEJzkwD+MI44euNKeOxieGTFGO9u
OAHrDOiPA5x8A7j1l4FaKWcBAL1Vt1x1FBxusxu7l+NNAv8J539x5s8lV+nP
DYr2mrcN
=A2xd
-----END PGP SIGNATURE-----
`.trim();

const calendarKey = `
-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v4.5.5
Comment: https://openpgpjs.org

xYYEXUk/FBYJKwYBBAHaRw8BAQdAz+rSEK/3XmhIeLQfpsmIPq96IrKYewYx
sagGgYBDg5H+CQMIAAECAwQFBgdgAAECAwQFBgcICQoLDA0OD9OqXwtfZYoj
JIdFbcHhUS5yJ1xROSrUnl/G6nm1hWp2Bawqhs/Enu+ZnXp78uOminXD239v
V80MQ2FsZW5kYXIga2V5wncEEBYKAB8FAl1JPxQGCwkHCAMCBBUICgIDFgIB
AhkBAhsDAh4BAAoJEG2YDApRSYyCRVIBAPiVZbaAfPqxjtNplhOtKiInEMju
lRBfEGsA0dw4YllWAQDl5OTLUSnywGs47jbS4SpjpswmTl9e3JX19sawLEdA
DceLBF1JPxQSCisGAQQBl1UBBQEBB0DTysT2EeKaVxfAN7nLXeibxVnkxrt3
No5bjB2YFVgZGQMBCAf+CQMIAAECAwQFBgdgAAECAwQFBgcICQoLDA0OD9JV
7BuCpJ7I2eelK/l9TYqQl6kquunkC7yLgps7yHxoJBywtitxiwO7xN7EawAQ
sRFYHrU2NMJhBBgWCAAJBQJdST8UAhsMAAoJEG2YDApRSYyCNJgA/jUdOIP6
m8kopzHnGC4AScqWC3mZptPAots23z6lJYojAQDo35pvSA24qZgUx4ZtIpHd
AHuAp3/jX0kawmQsHXK9Bg==
=5JEj
-----END PGP PRIVATE KEY BLOCK-----
`;

describe('keys', () => {
    it('should prepare calendar keys for owner', async () => {
        const decryptedPrivateKey = await decryptPrivateKey(DecryptableKey.PrivateKey, '123');
        const decryptedPassphrase = await decryptPassphrase({
            armoredPassphrase,
            armoredSignature,
            privateKeys: decryptedPrivateKey,
            publicKeys: decryptedPrivateKey.toPublic()
        });
        const decryptedCalendarKey = await decryptPrivateKey(calendarKey, decryptedPassphrase);
        expect(decryptedCalendarKey.isDecrypted()).toBeTruthy();
    });
});
