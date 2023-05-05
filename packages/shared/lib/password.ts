export const alphabeticChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const digits = '0123456789';
export const specialChars = '!#$%&()*+.:;<=>?@[]^';

export const generatePassword = (options: { useSpecialChars: boolean; length: number }) => {
    const chars = Array.from(alphabeticChars + digits + (options.useSpecialChars ? specialChars : ''));
    const randomValues = crypto.getRandomValues(new Uint8Array(options.length));

    const passwordChars = Array.from(randomValues).map((n) => {
        const rangeBoundMaxIndex = n % chars.length;
        return chars[rangeBoundMaxIndex];
    });

    return passwordChars.join('');
};
