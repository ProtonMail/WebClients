import { getRandomSrpVerifier, getSrp } from 'pmcrypto';

import { modulus, info } from './api/auth';

export default (api) => {
    /**
     * Perform the call and validate the server proof.
     * @param {Object} config
     * @param {Object} parameters
     * @param {Object} expectation
     * @return {Promise}
     */
    const callAndValidate = async (config, parameters, expectation) => {
        const { data, ...restConfig } = config;

        const result = await api({
            ...restConfig,
            data: {
                ...parameters,
                ...data
            }
        });

        const { ServerProof } = result;

        if (ServerProof !== expectation) {
            throw new Error('Unexpected server proof');
        }

        return result;
    };

    /**
     * Perform an SRP call authenticating your identity.
     * @param {Object} credentials
     * @param {String} credentials.Username
     * @param {String} credentials.Password
     * @param {String} credentials.TwoFactorCode
     * @param {Object} config - HTTP object to call
     * @return {Promise} - That resolves to the result of the call
     */
    const auth = async (credentials, config) => {
        const { username } = credentials;
        const authInfo = await api(info(username));
        const { parameters, expectation } = await getSrp(authInfo, credentials);
        return callAndValidate(config, parameters, expectation);
    };

    /**
     * Get initialization parameters for SRP.
     * @param {Object} credentials
     * @return {Promise}
     */
    const getInit = async (credentials) => {
        const data = await api(modulus());
        const result = await getRandomSrpVerifier(data, credentials);

        return {
            Auth: result
        };
    };

    /**
     * Perform an SRP initialization call with the random verifier
     * @param {Object} credentials
     * @param {String} credentials.Username
     * @param {String} credentials.Password
     * @param {String} credentials.TwoFactorCode
     * @param {Object} config - HTTP configuration object
     * @return {Promise} - That resolves to the result of the $http call
     */
    const init = async (credentials, config) => {
        const authParams = await getInit(credentials);

        const { data, ...restConfig } = config;

        return api({
            ...restConfig,
            data: {
                ...data,
                ...authParams
            }
        });
    };

    return {
        init,
        auth,
        callAndValidate
    };
};
