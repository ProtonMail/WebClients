import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic as validateMnemonicBip39 } from '@protontech/bip39';

export const generateMnemonicBase64RandomBytes = () => {
    const length = 16;
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    return randomValues.toBase64();
};

export const generateMnemonicFromBase64RandomBytes = (base64RandomBytes: string) => {
    const randomBytes = Uint8Array.fromBase64(base64RandomBytes);
    return entropyToMnemonic(randomBytes);
};

export const mnemonicToBase64RandomBytes = async (mnemonicWords: string) => {
    const randomBytes = await mnemonicToEntropy(mnemonicWords);
    return randomBytes.toBase64();
};

export const validateMnemonic = (mnemonic: string) => {
    return validateMnemonicBip39(mnemonic);
};
