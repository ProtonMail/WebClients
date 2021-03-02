import { getParsedAutocryptHeader } from '../../lib/mail/autocrypt';

const validKeyData = {
    base64: ` xjMEYAffqRYJKwYBBAHaRw8BAQdAFKaMT9wf5w6gMeW6X+6CSKCwTw5ohqESZQXzNfHG+CrN FDxwcm90b25xYUB5YWhvby5jb20+wncEEBYKAB8FAmAH36kGCwkHCAMCBBUICgIDFgIBAhkB AhsDAh4BAAoJEHhS0KVKBiDsdGgBAMzShBIHmMcpfR9wfXQdJZJBsO/3NTqJfpR6lQM7b0Yh AQDmVdb5v9XofabzXILvXFCsY6G8m2enwfCZw00YK/C0Dc44BGAH36kSCisGAQQBl1UBBQEB B0CnB3qq73mdvkEfyixD+hAk3+5vW/Gg5rZaPoV0gixGOwMBCAfCYQQYFggACQUCYAffqQIb DAAKCRB4UtClSgYg7On/AQDAh4kb5SvbWpxvAj2XJjSD3VnoTq4mXiYVX+5porb2XgEAijZr EgjyGGjkRTwRZ7+ufgn+Qfvk/6+uc7/3efwlngA=`,
    // prettier-ignore
    uint8array: new Uint8Array([198, 51, 4, 96, 7, 223, 169, 22, 9, 43, 6, 1, 4, 1, 218, 71, 15, 1, 1, 7, 64, 20, 166, 140, 79, 220, 31, 231, 14, 160, 49, 229, 186, 95, 238, 130, 72, 160, 176, 79, 14, 104, 134, 161, 18, 101, 5, 243, 53, 241, 198, 248, 42, 205, 20, 60, 112, 114, 111, 116, 111, 110, 113, 97, 64, 121, 97, 104, 111, 111, 46, 99, 111, 109, 62, 194, 119, 4, 16, 22, 10, 0, 31, 5, 2, 96, 7, 223, 169, 6, 11, 9, 7, 8, 3, 2, 4, 21, 8, 10, 2, 3, 22, 2, 1, 2, 25, 1, 2, 27, 3, 2, 30, 1, 0, 10, 9, 16, 120, 82, 208, 165, 74, 6, 32, 236, 116, 104, 1, 0, 204, 210, 132, 18, 7, 152, 199, 41, 125, 31, 112, 125, 116, 29, 37, 146, 65, 176, 239, 247, 53, 58, 137, 126, 148, 122, 149, 3, 59, 111, 70, 33, 1, 0, 230, 85, 214, 249, 191, 213, 232, 125, 166, 243, 92, 130, 239, 92, 80, 172, 99, 161, 188, 155, 103, 167, 193, 240, 153, 195, 77, 24, 43, 240, 180, 13, 206, 56, 4, 96, 7, 223, 169, 18, 10, 43, 6, 1, 4, 1, 151, 85, 1, 5, 1, 1, 7, 64, 167, 7, 122, 170, 239, 121, 157, 190, 65, 31, 202, 44, 67, 250, 16, 36, 223, 238, 111, 91, 241, 160, 230, 182, 90, 62, 133, 116, 130, 44, 70, 59, 3, 1, 8, 7, 194, 97, 4, 24, 22, 8, 0, 9, 5, 2, 96, 7, 223, 169, 2, 27, 12, 0, 10, 9, 16, 120, 82, 208, 165, 74, 6, 32, 236, 233, 255, 1, 0, 192, 135, 137, 27, 229, 43, 219, 90, 156, 111, 2, 61, 151, 38, 52, 131, 221, 89, 232, 78, 174, 38, 94, 38, 21, 95, 238, 105, 162, 182, 246, 94, 1, 0, 138, 54, 107, 18, 8, 242, 24, 104, 228, 69, 60, 17, 103, 191, 174, 126, 9, 254, 65, 251, 228, 255, 175, 174, 115, 191, 247, 121, 252, 37, 158, 0]),
};

describe('autocrypt  helper', () => {
    it('should parse a valid string', () => {
        const result = `addr=test@yahoo.com; prefer-encrypt=mutual; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual({
            addr: 'test@yahoo.com',
            'prefer-encrypt': 'mutual',
            keydata: validKeyData.uint8array,
        });
    });

    it('should parse a valid string with non-critical fields', () => {
        const result = `addr=test@yahoo.com; _other=test; prefer-encrypt=mutual; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual({
            addr: 'test@yahoo.com',
            _other: 'test',
            'prefer-encrypt': 'mutual',
            keydata: validKeyData.uint8array,
        });
    });

    it('should not parse a valid string that does not contain prefer-encrypt', () => {
        const result = `addr=test@yahoo.com; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual(undefined);
    });

    it('should not parse a valid string that contains an invalid prefer-encrypt', () => {
        const result = `addr=test@yahoo.com; _other=test; prefer-encrypt=none; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual(undefined);
    });

    it('should not parse invalid base64 keydata', () => {
        const result = `addr=test@yahoo.com; prefer-encrypt=mutual; keydata=a`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual(undefined);
    });

    it('should not parse an invalid string that contains critical unknown fields', () => {
        const result = `addr=test@yahoo.com; other=test; prefer-encrypt=mutual; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual(undefined);
    });

    it('should not parse an invalid string that does not contain addr', () => {
        const result = `other=test; prefer-encrypt=mutual; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual(undefined);
    });

    it('should not parse an invalid string', () => {
        const result = `addr=test@yahoo.com; prefer-encrypt=none; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual(undefined);
    });

    it('should not parse an unknown sender', () => {
        const result = `addr=unknown@yahoo.com; prefer-encrypt=mutual; keydata=${validKeyData.base64}`;
        expect(getParsedAutocryptHeader(result, 'test@yahoo.com')).toEqual(undefined);
    });
});
