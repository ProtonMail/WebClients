const decodeBase64 = (input: string) => atob(input);

export const stringToUint8Array = (str: string) => {
    const result = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
};

export const base64StringToUint8Array = (string: string) => stringToUint8Array(decodeBase64(string) || '');
