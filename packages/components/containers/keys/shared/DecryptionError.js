import { c } from 'ttag';

export const createDecryptionError = () => {
    const error = new Error(c('Error').t`Invalid decryption password`);
    error.name = 'DecryptionError';
    return error;
};
