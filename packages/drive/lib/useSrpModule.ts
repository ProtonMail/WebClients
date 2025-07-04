import { useRef } from 'react';

import { useApi } from '@proton/components';
import { srpGetVerify } from '@proton/shared/lib/srp';

export type SRPVerifier = {
    modulusId: string;
    version: number;
    salt: string;
    verifier: string;
};

export const useSrpModule = () => {
    const api = useApi();

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
        getSrpVerifier,
    });

    srpModule.current.getSrpVerifier = getSrpVerifier;

    return srpModule.current;
};
