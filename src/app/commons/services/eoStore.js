import { encodeUtf8Base64, decodeUtf8Base64 } from 'pmcrypto';

import { EO_DECRYPTED_TOKEN_KEY, EO_PASSWORD_KEY } from '../../constants';

/* @ngInject */
function eoStore(secureSessionStorage) {
    const getToken = () => {
        return secureSessionStorage.get(EO_DECRYPTED_TOKEN_KEY);
    };

    const setToken = (value) => {
        secureSessionStorage.set(EO_DECRYPTED_TOKEN_KEY, value);
    };

    const getPassword = () => {
        const value = secureSessionStorage.get(EO_PASSWORD_KEY);
        return value ? decodeUtf8Base64(value) : undefined;
    };

    const setPassword = (value) => {
        secureSessionStorage.set(EO_PASSWORD_KEY, encodeUtf8Base64(value));
    };

    return {
        getToken,
        setToken,
        getPassword,
        setPassword
    };
}

export default eoStore;
