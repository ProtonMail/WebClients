import { base64StringToUint8Array } from '../../lib/helpers/encoding';
import {
    generateMnemonicBase64RandomBytes,
    generateMnemonicFromBase64RandomBytes,
    mnemonicToBase64RandomBytes,
    validateMnemonic,
} from '../../lib/mnemonic';

describe('generateMnemonicBase64RandomBytes', () => {
    it('should return base64 string', () => {
        const base64RandomBytes = generateMnemonicBase64RandomBytes();

        expect(() => {
            base64StringToUint8Array(base64RandomBytes);
        }).not.toThrow();
    });

    it('should return base64 string of length 16', () => {
        const base64RandomBytes = generateMnemonicBase64RandomBytes();

        const randomBytes = base64StringToUint8Array(base64RandomBytes);

        expect(randomBytes.length).toBe(16);
    });
});

describe('generateMnemonicFromBase64RandomBytes', () => {
    it('should generate mnemonic', async () => {
        const base64RandomBytes = 'yNbY5xQk5N8ROW0Ci7Yg4g==';

        const result = await generateMnemonicFromBase64RandomBytes(base64RandomBytes);

        expect(result).toBe('silver replace degree choose exact hurdle eager color action frozen market series');
    });
});

describe('mnemonicToBase64RandomBytes', () => {
    it('should recover base 64 random bytes from mnemonic', async () => {
        const mnemonic = 'frozen craft abuse human property drama dutch frame carpet giant orange aim';

        const result = await mnemonicToBase64RandomBytes(mnemonic);

        expect(result).toBe('XaZABLdqxoRRGuQizDZvAg==');
    });
});

describe('validateMnemonic', () => {
    it('should return false for an invalid mnemonic', async () => {
        const invaldMnemonic = 'this is definitely an invalid mnemonic';

        const result = await validateMnemonic(invaldMnemonic);

        expect(result).toBeFalse();
    });

    it('should return true for a valid mnemonic', async () => {
        const validMnemonic = 'frozen craft abuse human property drama dutch frame carpet giant orange aim';

        const result = await validateMnemonic(validMnemonic);

        expect(result).toBeTrue();
    });
});
