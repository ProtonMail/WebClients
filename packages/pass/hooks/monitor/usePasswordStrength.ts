import { useEffect, useState } from 'react';

import type { WasmPasswordScore } from '@protontech/pass-rust-core/worker';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const usePasswordStrength = (password: string) => {
    const { core } = usePassCore();
    const [strength, setStrength] = useState<MaybeNull<WasmPasswordScore>>(null);

    useEffect(() => {
        (async () => {
            const score = password ? (await core.analyze_password(password))?.password_score : null;
            setStrength(score);
        })().catch(noop);
    }, [password]);

    return strength;
};
