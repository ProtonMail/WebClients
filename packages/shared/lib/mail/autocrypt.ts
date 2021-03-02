import { binaryStringToArray, decodeBase64 } from 'pmcrypto';

const MANDATORY_FIELDS = ['keydata', 'addr'];
const OPTIONAL_FIELDS = ['prefer-encrypt'];
const CRITICAL_FIELDS = OPTIONAL_FIELDS.concat(MANDATORY_FIELDS);

export interface AutocryptHeader {
    addr: string;
    keydata: Uint8Array;
    'prefer-encrypt'?: 'mutual';
    // Non-critical optional fields
    [_key: string]: undefined | string | Uint8Array;
}

// Parse according to https://autocrypt.org/level1.html#the-autocrypt-header
export const getParsedAutocryptHeader = (header = '', sender = ''): AutocryptHeader | undefined => {
    let invalid = false;

    const result: AutocryptHeader = Object.fromEntries(
        header
            .split(';')
            .map((keyValue) => {
                const trimmedKeyValue = keyValue.trim();

                // For ease of parsing, the keydata attribute MUST be the last attribute in this header. Avoid splitting by = since it's base64
                if (trimmedKeyValue.startsWith('keydata=')) {
                    try {
                        const keydataStringValue = trimmedKeyValue.slice('keydata='.length);
                        const keydataValue = binaryStringToArray(decodeBase64(keydataStringValue));
                        return ['keydata', keydataValue];
                    } catch (e) {
                        return ['', ''];
                    }
                }

                const [parsedKey = '', parsedValue = ''] = keyValue.split('=');

                const key = parsedKey.trim();

                // It MUST treat the entire Autocrypt header as invalid if it encounters a “critical” attribute that it doesn’t support.
                if (!CRITICAL_FIELDS.includes(key) && !key.startsWith('_')) {
                    invalid = true;
                    return ['', ''];
                }

                return [key, parsedValue.trim()];
            })
            .filter(([key, value]) => {
                return key && value;
            })
    );

    // The mandatory fields must be present.
    if (MANDATORY_FIELDS.some((field) => !result[field]) || invalid) {
        return;
    }

    // If addr differs from the addr in the From header, the entire Autocrypt header MUST be treated as invalid.
    if (result.addr.toLowerCase() !== sender.toLowerCase()) {
        return;
    }

    // The prefer-encrypt attribute is optional and can only occur with the value mutual.
    // Its presence in the Autocrypt header indicates an agreement to enable encryption by default.
    if (result['prefer-encrypt'] !== 'mutual') {
        return;
    }

    return result;
};
