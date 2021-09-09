import { getFormattedAlgorithmNames } from '../../lib/keys';

describe('key algorithm', () => {
    it('should aggregate same key types and sizes', async () => {
        const type = getFormattedAlgorithmNames([
            { algorithm: 'rsa', bits: 2048 },
            { algorithm: 'rsa', bits: 2048 },
            { algorithm: 'ecdh', curve: 'P-521' },
            { algorithm: 'ecdsa', curve: 'P-256' },
            { algorithm: 'ecdh', curve: 'P-256' },
            { algorithm: 'elgamal', bits: 4096 },
            { algorithm: 'rsa', bits: 4096 },
        ]);

        expect(type).toEqual('RSA (2048), ECC (P-521), ECC (P-256), ElGamal (4096), RSA (4096)');
    });

    it('should return same curve name for eddsa and edch over curve25519', async () => {
        const type = getFormattedAlgorithmNames([
            { algorithm: 'ecdh', curve: 'curve25519' },
            { algorithm: 'eddsa', curve: 'ed25519' },
        ]);

        expect(type).toEqual('ECC (Curve25519)');
    });
});
