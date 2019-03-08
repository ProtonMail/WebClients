import { getSrp, getRandomSrpVerifier } from 'pm-srp';

import { convertLegacyCredentials } from '../../../helpers/passwordsHelper';

/* @ngInject */
function srp($http, authApi) {
    /**
     * Call the API with the SRP parameters and validate the server proof.
     * @param {Object} config
     * @param {Object} authData
     * @param {String} ExpectedServerProof
     * @return {Promise}
     */
    const callAndValidate = async ({ data, ...restConfig }, authData, ExpectedServerProof) => {
        const result = await $http({
            ...restConfig,
            data: {
                ...authData,
                ...data
            }
        });
        const {
            data: { ServerProof }
        } = result;

        if (ServerProof !== ExpectedServerProof) {
            throw new Error('Unexpected server proof');
        }

        return result;
    };

    /**
     * Perform an SRP call authenticating your identity.
     * @param {Object} legacyCredentials
     * @param {Object} config - Config to pass to the $http method.
     * @param {Object} [info] - Result from auth/info call
     * @param {Number} [version] - Auth version to use
     * @return {Promise} - That resolves to the result of the call
     */
    const auth = async (legacyCredentials, config, info, version) => {
        const credentials = convertLegacyCredentials(legacyCredentials);
        const authInfo = info || (await authApi.info(credentials.username));
        const { expectedServerProof, clientProof, clientEphemeral } = await getSrp(authInfo, credentials, version);
        const authData = {
            ClientProof: clientProof,
            ClientEphemeral: clientEphemeral,
            TwoFactorCode: credentials.totp,
            SRPSession: authInfo.SRPSession
        };
        return callAndValidate(config, authData, expectedServerProof);
    };

    /**
     * Get initialization parameters for SRP.
     * @param {Object} legacyCredentials
     * @return {Promise}
     */
    const getVerify = async (legacyCredentials) => {
        const credentials = convertLegacyCredentials(legacyCredentials);
        const data = await authApi.modulus();
        const { version, salt, verifier } = await getRandomSrpVerifier(data, credentials);
        const authData = {
            ModulusID: data.ModulusID,
            Version: version,
            Salt: salt,
            Verifier: verifier
        };
        return {
            Auth: authData
        };
    };

    /**
     * Perform an SRP call with the random verifier.
     * @param {Object} legacyCredentials
     * @param {Object} config - Config to pass to the $http method.
     * @param {Object} [data] - Data to pass
     * @return {Promise} - That resolves to the result of the $http call
     */
    const verify = async (legacyCredentials, { data, ...restConfig }) => {
        const authData = await getVerify(legacyCredentials);
        return $http({
            ...restConfig,
            data: {
                ...data,
                ...authData
            }
        });
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
