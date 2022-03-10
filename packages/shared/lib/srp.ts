import { getSrp, getRandomSrpVerifier } from '@proton/srp';

import { getInfo, getModulus } from './api/auth';
import { Api } from './interfaces';
import { InfoResponse, ModulusResponse } from './authentication/interface';

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

export interface SrpConfig {
    [key: string]: any;
}

/**
 * Call the API with the SRP parameters and validate the server proof.
 */
interface CallAndValidateArguments {
    api: Api;
    config: SrpConfig;
    authData: SrpAuthData;
    expectedServerProof: string;
}
const callAndValidate = async <T>({
    api,
    config: { data, ...restConfig },
    authData,
    expectedServerProof,
}: CallAndValidateArguments) => {
    const result = await api<T & { ServerProof: string }>({
        ...restConfig,
        data: {
            ...authData,
            ...data,
        },
    });
    const { ServerProof } = result;

    if (ServerProof !== expectedServerProof) {
        throw new Error('Unexpected server proof');
    }

    return result;
};

/**
 * Perform an API call with SRP auth.
 */
interface SrpAuthArguments {
    api: Api;
    credentials: Credentials;
    config: SrpConfig;
    info?: InfoResponse;
    version?: number;
}
export const srpAuth = async <T>({ api, credentials, config, info, version }: SrpAuthArguments) => {
    const actualInfo = info || (await api<InfoResponse>(getInfo(credentials.username)));
    const { expectedServerProof, clientProof, clientEphemeral } = await getSrp(actualInfo, credentials, version);
    const authData = {
        ClientProof: clientProof,
        ClientEphemeral: clientEphemeral,
        TwoFactorCode: credentials.totp,
        SRPSession: actualInfo.SRPSession,
    };
    return callAndValidate<T>({
        api,
        config,
        authData,
        expectedServerProof,
    });
};

/**
 * Get initialization parameters for SRP.
 */
export const srpGetVerify = async ({ api, credentials }: { api: Api; credentials: Credentials }) => {
    const data = await api<ModulusResponse>(getModulus());
    const { version, salt, verifier } = await getRandomSrpVerifier(data, credentials);
    const authData = {
        ModulusID: data.ModulusID,
        Version: version,
        Salt: salt,
        Verifier: verifier,
    };
    return {
        Auth: authData,
    };
};

/**
 * Perform an SRP call with the random verifier.
 */
export const srpVerify = async <T>({
    api,
    credentials,
    config: { data, ...restConfig },
}: {
    api: Api;
    credentials: Credentials;
    config: SrpConfig;
}) => {
    const authData = await srpGetVerify({ api, credentials });
    return api<T>({
        ...restConfig,
        data: {
            ...data,
            ...authData,
        },
    });
};
