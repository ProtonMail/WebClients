import { useRef } from 'react';

import { useApi } from '@proton/components';
import { srpGetVerify } from '@proton/shared/lib/srp';
import { computeKeyPassword, getSrp as srpModuleGetSrp } from '@proton/srp/lib';

export type SRPVerifier = {
    modulusId: string;
    version: number;
    salt: string;
    verifier: string;
};

export const useSrpModule = () => {
    const api = useApi();

    const getSrp = async (
        version: number,
        modulus: string,
        serverEphemeral: string,
        salt: string,
        password: string
    ): Promise<{
        expectedServerProof: string;
        clientProof: string;
        clientEphemeral: string;
    }> => {
        return srpModuleGetSrp(
            {
                Version: version,
                Modulus: modulus,
                ServerEphemeral: serverEphemeral,
                Salt: salt,
            },
            {
                password,
            }
        );
    };

    const getSrpVerifier = async (password: string): Promise<SRPVerifier> => {
        const { Auth } = await srpGetVerify({ api, credentials: { password } });
        return {
            modulusId: Auth.ModulusID,
            version: Auth.Version,
            salt: Auth.Salt,
            verifier: Auth.Verifier,
        };
    };

    // Ensure the reference is stable across renders. Never update the whole object.
    const srpModule = useRef({
        getSrp,
        getSrpVerifier,
        computeKeyPassword,
    });

    srpModule.current.getSrp = getSrp;
    srpModule.current.getSrpVerifier = getSrpVerifier;
    srpModule.current.computeKeyPassword = computeKeyPassword;

    return srpModule.current;
};
