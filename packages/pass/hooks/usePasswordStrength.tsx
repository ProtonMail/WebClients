import { useEffect, useState } from 'react';

import type { WasmPasswordScore } from '@protontech/pass-rust-core';

import type { Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { usePassCore } from '../components/Core/PassCoreProvider';

export const usePasswordStrength = (password: string) => {
    const { analyzePassword } = usePassCore();
    const [strength, setStrength] = useState<Maybe<WasmPasswordScore>>(undefined);

    useEffect(() => {
        (async () => {
            const result = password ? await analyzePassword(password) : undefined;
            setStrength(result?.password_score);
        })().catch(noop);
    }, [password]);

    return strength;
};
