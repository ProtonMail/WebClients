import { useEffect, useState } from 'react';

import type { PasswordScore } from '@protontech/pass-rust-core/worker';

import noop from '@proton/utils/noop';

import { usePassCore } from '../../components/Core/PassCoreProvider';
import type { MaybeNull } from '../../types';

export const usePasswordStrength = (password: string) => {
    const { core } = usePassCore();
    const [strength, setStrength] = useState<MaybeNull<PasswordScore>>(null);

    useEffect(() => {
        (async () => {
            const score = password ? (await core.analyze_password(password))?.password_score : null;
            setStrength(score);
        })().catch(noop);
    }, [password]);

    return strength;
};
