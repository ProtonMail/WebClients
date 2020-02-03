// @ts-ignore - pm-srp does not have typings, todo
import { getSrp, getRandomSrpVerifier } from 'pm-srp';

import { getInfo, getModulus } from './api/auth';
import { Api } from './interfaces';
import { AuthInfo, AuthModulus } from './interfaces/Auth';

interface Credentials {
    username?: string;
    password: string;
    totp?: string;
}

interface SrpAuthData {
    ClientProof: string;
    ClientEphemeral: string;
    TwoFactorCode?: string;
    SRPSession: string;
}

interface Config {
    [key: string]: any;
}

/**
 * Call the API with the SRP parameters and validate the server proof.
 */
interface CallAndValidateArguments {
    api: Api;
    config: Config;
    authData: SrpAuthData;
    expectedServerProof: string;
}
const callAndValidate = async <T>({
    api,
    config: { data, ...restConfig },
    authData,
    expectedServerProof
}: CallAndValidateArguments) => {
    const result = await api<T & { ServerProof: string }>({
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
 * Perform an API call with SRP auth.
 * @param api - Api function
 * @param credentials - Credentials entered by the user
 * @param config - Config to pass to the Api function
 * @param [info] - Result from auth/info call
 * @param [version] - Auth version to use
 * @return {Promise} - That resolves to the result of the call
 */
interface SrpAuthArguments {
    api: Api;
    credentials: Credentials;
    config: Config;
    info?: AuthInfo;
    version?: number;
}
export const srpAuth = async <T>({ api, credentials, config, info, version }: SrpAuthArguments) => {
    const authInfo = info || (await api<AuthInfo>(getInfo(credentials.username)));
    const { expectedServerProof, clientProof, clientEphemeral } = await getSrp(authInfo, credentials, version);
    const authData = {
        ClientProof: clientProof,
        ClientEphemeral: clientEphemeral,
        TwoFactorCode: credentials.totp,
        SRPSession: authInfo.SRPSession
    };
    return callAndValidate<T>({
        api,
        config,
        authData,
        expectedServerProof
    });
};

/**
 * Get initialization parameters for SRP.
 */
export const srpGetVerify = async ({ api, credentials }: { api: Api; credentials: Credentials }) => {
    const data = await api<AuthModulus>(getModulus());
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
 * @param api - Api function
 * @param credentials - Credentials entered by the user
 * @param config - Config to pass to the Api function
 */
export const srpVerify = async <T>({
    api,
    credentials,
    config: { data, ...restConfig }
}: {
    api: Api;
    credentials: Credentials;
    config: Config;
}) => {
    const authData = await srpGetVerify({ api, credentials });
    return api<T>({
        ...restConfig,
        data: {
            ...data,
            ...authData
        }
    });
};
