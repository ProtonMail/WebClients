import { getSrp, getRandomSrpVerifier } from 'pm-srp';

import { getInfo, getModulus } from './api/auth';

function srp(api) {
    /**
     * Call the API with the SRP parameters and validate the server proof.
     * @param {Object} config
     * @param {Object} authData
     * @param {String} expectedServerProof
     * @return {Promise}
     */
    const callAndValidate = async ({ data, ...restConfig }, authData, expectedServerProof) => {
        const result = await api({
            ...restConfig,
            data: {
                ...authData,
                ...data
            }
        });
        const { ServerProof } = result;

        if (ServerProof !== expectedServerProof) {
            throw new Error('Unexpected server proof');
        }

        return result;
    };

    /**
     * Perform an SRP call authenticating your identity.
     * @param {Object} credentials
     * @param {Object} config - Config to pass to the api method.
     * @param {Object} [info] - Result from auth/info call
     * @param {Number} [version] - Auth version to use
     * @return {Promise} - That resolves to the result of the call
     */
    const auth = async (credentials, config, info, version) => {
        const authInfo = info || (await api(getInfo(credentials.username)));
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
     * @return {Promise}
     */
    const getVerify = async (credentials) => {
        const data = await api(getModulus());
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
     * @param {Object} credentials
     * @param {Object} config - Config to pass to the api method.
     * @param {Object} [data] - Data to pass
     * @return {Promise} - That resolves to the result of the api call
     */
    const verify = async (credentials, { data, ...restConfig }) => {
        const authData = await getVerify(credentials);
        return api({
            ...restConfig,
            data: {
                ...data,
                ...authData
            }
        });
    };

    return {
        getVerify,
        verify,
        auth
    };
}

export default srp;
