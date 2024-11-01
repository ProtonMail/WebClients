import { getRandomSrpVerifier, getSrp } from '@proton/srp';

import { getInfo, getModulus } from './api/auth';
import type { Fido2Data, InfoResponse, ModulusResponse } from './authentication/interface';
import type { Api } from './interfaces';

export interface AuthCredentials {
    username?: string;
    password: string;
}

export type Credentials =
    | AuthCredentials
    | (AuthCredentials & { totp: string })
    | (AuthCredentials & { fido2: Fido2Data });

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

const callAndValidate = async ({
    api,
    config: { data, ...restConfig },
    authData,
    expectedServerProof,
}: CallAndValidateArguments) => {
    const response: Response = await api({
        ...restConfig,
        output: 'raw',
        data: {
            ...authData,
            ...data,
        },
    });
    const clonedResponse = response.clone();
    const result = await clonedResponse.json();

    const { ServerProof } = result;
    if (ServerProof !== expectedServerProof) {
        throw new Error('Unexpected server proof');
    }

    return response;
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

export const srpAuth = async ({ api, credentials, config, info, version }: SrpAuthArguments) => {
    const actualInfo = info || (await api<InfoResponse>(getInfo({ username: credentials.username })));
    const { expectedServerProof, clientProof, clientEphemeral } = await getSrp(actualInfo, credentials, version);
    const authData = {
        ClientProof: clientProof,
        ClientEphemeral: clientEphemeral,
        SRPSession: actualInfo.SRPSession,
        ...('totp' in credentials ? { TwoFactorCode: credentials.totp } : undefined),
        ...('fido2' in credentials ? { FIDO2: credentials.fido2 } : undefined),
    };
    return callAndValidate({
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
export const srpVerify = async <T = any>({
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
