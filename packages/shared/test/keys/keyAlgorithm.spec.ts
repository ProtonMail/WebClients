import { getFormattedAlgorithmNames } from '../../lib/keys';

describe('key algorithm', () => {
    it('should aggregate same key types and sizes', async () => {
        const type = getFormattedAlgorithmNames(
            [
                { algorithm: 'rsaEncryptSign', bits: 2048 },
                { algorithm: 'rsaEncryptSign', bits: 2048 },
                { algorithm: 'ecdh', curve: 'nistP521' },
                { algorithm: 'ecdsa', curve: 'nistP256' },
                { algorithm: 'ecdh', curve: 'nistP256' },
                { algorithm: 'elgamal', bits: 4096 },
                { algorithm: 'rsaEncryptSign', bits: 4096 },
            ],
            4
        );

        expect(type).toEqual('RSA (2048), ECC (NIST P521), ECC (NIST P256), ElGamal (4096), RSA (4096)');
    });

    it('should return same curve name for eddsa and edch over curve25519', async () => {
        const type = getFormattedAlgorithmNames(
            [
                { algorithm: 'ecdh', curve: 'curve25519Legacy' },
                { algorithm: 'eddsaLegacy', curve: 'ed25519Legacy' },
            ],
            4
        );

        expect(type).toEqual('ECC (Curve25519)');
    });

    it('should differentiate between new and legacy eddsa algorithms', async () => {
        const type = getFormattedAlgorithmNames(
            [{ algorithm: 'eddsaLegacy', curve: 'ed25519Legacy' }, { algorithm: 'x25519' }, { algorithm: 'ed25519' }],
            4
        );

        expect(type).toEqual('ECC (Curve25519), ECC (Curve25519, new format)');
    });

    it('should display a _V6 suffix if `keyVersion = 6`', async () => {
        const type = getFormattedAlgorithmNames(
            [
                { algorithm: 'x25519' },
                { algorithm: 'ed25519' },
                { algorithm: 'pqc_mldsa_ed25519' },
                { algorithm: 'pqc_mlkem_x25519' },
            ],
            6
        );

        expect(type).toEqual('ECC_V6 (Curve25519, new format), PQC_V6 (MLDSA_ED25519), PQC_V6 (MLKEM_X25519)');
    });
});
