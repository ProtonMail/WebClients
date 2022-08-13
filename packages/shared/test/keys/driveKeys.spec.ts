import { CryptoProxy } from '@proton/crypto';

import { decryptUnsigned } from '../../lib/keys/driveKeys';

const shareKey =
    '-----BEGIN PGP PRIVATE KEY BLOCK-----\r\nVersion: OpenPGP.js v4.4.7\r\nComment: https://openpgpjs.org\r\n\r\nxYYEXc5yKRYJKwYBBAHaRw8BAQdA7YwZxjkyb1yO+SbFT9fIgjIec6vjvFv8\r\nALFUUkDfFlH+CQMIlbaxxwTqxCxg2HU8LGqFPpBAD0A/TvV9kXdZwhycrEDn\r\nKy/2v6wWMSp5gzXgX1FxhOmg5uWNhW3P9/dIt32F+fRrolr+uljAvZB7zBN1\r\nWM0XSm9obiBEb2UgPGpvaG5AZG9lLmRvZT7CdwQQFgoAHwUCXc5yKQYLCQcI\r\nAwIEFQgKAgMWAgECGQECGwMCHgEACgkQ8y3YQiuJcn7Y+AEAzPynnBV2cjd2\r\nVrDtpNVXiGIk3CSSqEl5fpgRyxuD4HoBALcyYPyaJxPxNml99ZZ3p4GuJ474\r\nobF83u/7Lk6vhJ0Px4sEXc5yKRIKKwYBBAGXVQEFAQEHQPnJbOsSgJnu399H\r\niMn8iV8kMNkO65lkaofKmdwPUTQMAwEIB/4JAwjxK/aFhMu7xWCx5fIR519p\r\n3cxxTRdUo09VrK9Fm7fXKa6+GIPccTabyy53dZ9edneZ+GZRRQOos/vG+3zS\r\n3ICeUYGyVT3H5WkUqc+zl18LwmEEGBYIAAkFAl3OcikCGwwACgkQ8y3YQiuJ\r\ncn4i5gD7BQX8rl0tRIcNpY+e71mIbx+/+PANMzlGXNBxtySpXAgBAKKgI/3M\r\npNM92ezA6/XB7O5b0dhooMQvwAxSOS1W07kA\r\n=U3/f\r\n-----END PGP PRIVATE KEY BLOCK-----\r\n'.trim();
const addressKey =
    '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: ProtonMail\n\n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\n7W+fRSMAVfXUqGg24pQm0PZK7mQ=\n=HFGf\n-----END PGP PRIVATE KEY BLOCK-----\n';
const passphrase =
    '-----BEGIN PGP MESSAGE-----\nVersion: ProtonMail\n\nwcBMA6rw6TH9oRKuAQf/dm5wc29Oi51Ieq/miflqQ4rxGvfhe4WD4L9zPxOe\nfe1nndclW0I/7zJ49bmEQGOIw3lBVnBJotupYH8We82+31lICcKdwNAhLwRD\nowCNKPHrgRwpMohz33r/vkjf/QsGLW2xstrqk+ZZqqEtANHnSfnTxU9XJIiJ\nlVkXZ/5cpTwvCGOLapSiHUG8bYhZikxr9CSM0fMCnuwlYGbhd+o9FoWOIVpg\nQZHfxioyramL6GmiXZ15FvRS3Gd3pjjATZY/wv19LQkv1NJSugyGx1X6fj5D\n8tf1Yh7OVDueY9gtYs+oV+d64czbvW/q30MKWgf5EipiS4ZA2PSEYNMP9OWo\nf9J4AVAMupTz2usGyX/3rF2r2JhsZMVLcuBlaBbi0GZcyGkiMmCl/+f7fRTc\nIVLCuzqftyh9VAQyj6T2x2fe3S0ivfJFVwEnF4QJ/K4+j9qgnkN9aGXX4UkU\nMKtBrnZ8BmtMn0FBQWicz1JeGX+YGmcT476uj2psxxJS\n=3Go2\n-----END PGP MESSAGE-----\n';
const folderName =
    '-----BEGIN PGP MESSAGE-----\nVersion: ProtonMail\n\nwV4D7bIbvfUVIgMSAQdAo0jDKpBeHzQDAjGPYPgMjLUFa3Rfs2U1c/XJxD69\njRow+Hz5SU5CAkSJmSHHYsctlaCcsRCfmkl62A5JIXfV/wHRDk0Usi6NIstq\n3aD+ywyr0j8BNY0gX2w08fWEyMDGAcYeqJay0zmsPRg9l59XYySAOAShlVvN\nQa/vQWCAxl/Bk1iYctxCPCDVslSMYRJeG2A=\n=Lj9p\n-----END PGP MESSAGE-----\n'.trim();

describe('drive keys', () => {
    it('should prepare drive keys', async () => {
        const decryptedPrivateKey = await CryptoProxy.importPrivateKey({
            armoredKey: addressKey,
            passphrase: 'oXueLX2EKIM.mwS7qmU2wvfNXb3KI3i',
        });
        const decryptedPassphrase = await decryptUnsigned({
            armoredMessage: passphrase,
            privateKey: decryptedPrivateKey,
        });

        const decryptedShareKey = await CryptoProxy.importPrivateKey({
            armoredKey: shareKey,
            passphrase: decryptedPassphrase,
        });
        const decryptedFolderName = await decryptUnsigned({
            armoredMessage: folderName,
            privateKey: decryptedShareKey,
        });

        expect(decryptedFolderName).toBe('folder1');
    });
});
