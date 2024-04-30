import { useEffect, useState } from 'react';

import type { WasmPasswordScore } from '@protontech/pass-rust-core';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const usePasswordStrength = (password: string) => {
    const { monitor } = usePassCore();
    const [strength, setStrength] = useState<MaybeNull<WasmPasswordScore>>(null);

    useEffect(() => {
        (async () => {
            const score = password ? (await monitor.analyzePassword(password))?.password_score ?? null : null;
            setStrength(score);
        })().catch(noop);
    }, [password]);

    return strength;
};
