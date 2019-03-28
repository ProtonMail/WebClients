import { srpAuth, srpVerify, srpGetVerify } from 'proton-shared/lib/srp';

import { convertLegacyCredentials } from '../../../helpers/passwordsHelper';

/* @ngInject */
function srp(compatApi) {
    // Angular expects result wrapped in an object containing data.
    const wrapCompat = (data) => ({ data });

    /**
     * Perform an SRP call authenticating your identity.
     * @param {Object} legacyCredentials
     * @param {Object} config - Config to pass to the $http method.
     * @param {Object} [info] - Result from auth/info call
     * @param {Number} [version] - Auth version to use
     * @return {Promise} - That resolves to the result of the call
     */
    const auth = async (legacyCredentials, config, info, version) => {
        return srpAuth({
            api: compatApi,
            credentials: convertLegacyCredentials(legacyCredentials),
            config,
            info,
            version
        }).then(wrapCompat);
    };

    /**
     * Get initialization parameters for SRP.
     * @param {Object} legacyCredentials
     * @return {Promise}
     */
    const getVerify = async (legacyCredentials) => {
        return srpGetVerify({
            api: compatApi,
            credentials: convertLegacyCredentials(legacyCredentials)
        });
    };

    /**
     * Perform an SRP call with the random verifier.
     * @param {Object} legacyCredentials
     * @param {Object} config - Config to pass to the $http method.
     * @param {Object} [data] - Data to pass
     * @return {Promise} - That resolves to the result of the $http call
     */
    const verify = async (legacyCredentials, config) => {
        return srpVerify({
            api: compatApi,
            credentials: convertLegacyCredentials(legacyCredentials),
            config
        }).then(wrapCompat);
    };

    const createHttpCall = (cb, method) => (credentials, url, data, config) =>
        cb(credentials, { method, url, data, ...config });

    // Create a simple http api for a callback
    const createHttp = (cb) => {
        cb.put = createHttpCall(cb, 'put');
        cb.post = createHttpCall(cb, 'post');
        return cb;
    };

    return {
        getVerify,
        verify: createHttp(verify),
        auth: createHttp(auth)
    };
}

export default srp;
