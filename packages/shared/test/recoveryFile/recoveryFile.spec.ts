import type { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';

import { parseRecoveryFiles } from '../../lib/recoveryFile/recoveryFile';

describe('recoveryFile', () => {
    describe('parseRecoveryFiles', () => {
        it('returns empty array if no keys can be decrypted', async () => {
            const recoveryFiles = ['invalid recovery file'];
            const recoverySecrets: KeyWithRecoverySecret[] = [
                {
                    ID: '1',
                    Primary: 1,
                    Active: 1,
                    Fingerprint: 'Fingerprint',
                    Fingerprints: [],
                    Version: 1,
                    PrivateKey: 'PrivateKey',
                    Signature: 'Signature',
                    RecoverySecret: 'RecoverySecret',
                    RecoverySecretSignature: 'RecoverySecretSignature',
                },
            ];

            const result = await parseRecoveryFiles(recoveryFiles, recoverySecrets);

            expect(result).toEqual([]);
        });

        it('decrypts keys from recovery file using the recovery secrets', async () => {
            const recoveryFiles = [
                '-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwy4ECQMIdx7exdMdvOtgIXzvh1XfBSpFUuAMaj5OoQCmIJKYya6CF7SVMu4s\r\ntLL90sF6ARi45hSfd5ZNgNH4YK9AYFc06fE95mBnB7/IzVfgJTZFTIgPTRl+\r\nlBeMKit7iz8iygI1BGlCLb6ZyP2KS29/P8NN5BWaSgB/1OVNTNMn9QblRyfB\r\n9ckoN4Co92NjNKwSwBicCwoahhLQACcDYfeFsuXleGW3rV4fVYINWKdYRJKO\r\njMk/6PMc2cRmfSApicSqvq6LPtrLfT6aV9M1/M3xgQAMRdU+KWTPtHNG/hXA\r\nKZPz1rTWQHxjA1jgl8hsihhILmoIHf0en3EkbQZSDLGU36ov4qQGEo6Wnrxr\r\n2uZxXOVtYKRPHb0qDLlIGU4qBKjfAnQwUHAL8Q1SQklZenw4eheP7bGuosvr\r\n2Nd5cD7G3c1m+NCSF2+XS8FWleTxcmd40ggl4l61qJ+Qz/U+gr6lr1O9rzRz\r\n2cJSOC2dy/NYRWKB8UVhaI3hhxnQhUvzUOj0PpkwmCmSzGOJkDrOiDtYmHZr\r\nt0YOR0dFjKqNAz6RIc6MQLKp9j+d7Dhe8cII/dxVNUmW+Vh6cqE2XhsgbIYu\r\nDgziI1j8CLV3KJJfjlgws0aQsNKGHb3WsNbQkllhind7AKLxBVel6ZJ2uy2N\r\nKynBQ63jLe8fu1GUbeoyKTZ3aPTVCdeY8aSBG8TLtXZ2U28udIaeKVQisp2x\r\nfkwl6k8jHdRBG9a0rrAobzEeEWAanjytqt8BnmDkDJYFcnrmASc7cDp4VFcn\r\nJLGF8aUuZ5LVD+yPzg9VqzhHRzqxsVvBnqJGd/qDzeWXVejG\r\n=51yq\r\n-----END PGP MESSAGE-----',
            ];
            const recoverySecrets: KeyWithRecoverySecret[] = [
                {
                    ID: '38g3A5xjaoqFPg_vup9c1gHiJonqDNSOwOdZPd-Wjp-nzHQV0lXoVdq6GS11-g28B90viPUxMW3nQ9zgk0TzmA==',
                    Primary: 1,
                    Active: 1,
                    Fingerprint: 'b50e775fdd67a73e85b3e8dd10ec81b36975d982',
                    Fingerprints: [],
                    Version: 3,
                    PrivateKey:
                        '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: ProtonMail\n\nxYYEYtARORYJKwYBBAHaRw8BAQdAUq67LdtCJ0/BZWiLUQ+yDf4H5d5J11LX\nr0Vo6DmGSq/+CQMIFuUKHWx/RkZg7tTbHb5HD31PLT9+OrKl2wQKPrsSkv54\nya9a1+CWAB+Hn9iu+6HTca3rj3WSqy/gbp5P+JB/TuhHFsangxLfYFqvkyFe\ncc07bm90X2Zvcl9lbWFpbF91c2VAZG9tYWluLnRsZCA8bm90X2Zvcl9lbWFp\nbF91c2VAZG9tYWluLnRsZD7CjwQQFgoAIAUCYtAROQYLCQcIAwIEFQgKAgQW\nAgEAAhkBAhsDAh4BACEJEBDsgbNpddmCFiEEtQ53X91npz6Fs+jdEOyBs2l1\n2YIP8gEAjjFVIlPIl7DYx5iopxTlzZCuYXiPYu6FkJT2lQLNcnYBAM/GEb2v\n2GocnGXvVztd2L9LafKoiZ/NUn2mx3+aqRANx4sEYtARORIKKwYBBAGXVQEF\nAQEHQLdzFWS+gMPQ+Ve7AFsV6h7F8Wp0e8npXTXplioPSWJpAwEIB/4JAwhQ\nIBWPXSobzmD0D6BynuyDvgnKRKNIkcn+877QQ/0KB52TyxYj76bl7bLEqItN\nr5c6z8rBAXu2MIaMO8uzbbIVxyluvwYmHu6x8l7ExSsGwngEGBYIAAkFAmLQ\nETkCGwwAIQkQEOyBs2l12YIWIQS1Dndf3WenPoWz6N0Q7IGzaXXZghH1AP4r\n0h1efEeP3ZoW3WmS7alxTgp0B/baYzYczxRLcZp7nQD7BLERoW7ENaszG6JA\nojZaWBqq3SDwb505wwCxZ/kMnA8=\n=AAX0\n-----END PGP PRIVATE KEY BLOCK-----\n',

                    Signature: '',
                    RecoverySecret: 'P3/THKBFAc8MDJHH635oUnM1it9/A23spz5zRRrT90U=',
                    RecoverySecretSignature:
                        '-----BEGIN PGP SIGNATURE-----\nVersion: ProtonMail\n\nwnUEARYKAAYFAmLRcoMAIQkQEOyBs2l12YIWIQS1Dndf3WenPoWz6N0Q7IGz\naXXZgoYWAQDjLFftBiDKD9x5vPmdWPUdFiQn87YhVyB9CLLpLz5HXgEA8mt2\nnD9+t4gyVjHkFgTpLr89coWRO4MX82m4o23qcwY=\n=wJHG\n-----END PGP SIGNATURE-----\n',
                },
            ];

            const result = await parseRecoveryFiles(recoveryFiles, recoverySecrets);

            expect(result.map((key) => key.fingerprint)).toEqual(['b50e775fdd67a73e85b3e8dd10ec81b36975d982']);
        });
    });
});
