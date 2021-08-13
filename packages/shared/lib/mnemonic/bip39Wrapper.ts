import getRandomValues from '@proton/get-random-values';
import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic as validateMnemonicBip39 } from 'bip39';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '../helpers/encoding';

export const generateMnemonicBase64RandomBytes = () => {
    const length = 16;
    const randomValues = getRandomValues(new Uint8Array(length));
    return uint8ArrayToBase64String(randomValues);
};

export const generateMnemonicFromBase64RandomBytes = (base64RandomBytes: string) => {
    const randomBytes = base64StringToUint8Array(base64RandomBytes);
    return entropyToMnemonic(randomBytes);
};

export const mnemonicToBase64RandomBytes = async (mnemonicWords: string) => {
    const randomBytes = await mnemonicToEntropy(mnemonicWords);
    return uint8ArrayToBase64String(randomBytes);
};

export const validateMnemonic = (mnemonic: string) => {
    return validateMnemonicBip39(mnemonic);
};
