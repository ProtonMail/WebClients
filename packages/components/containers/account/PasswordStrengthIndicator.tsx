import { useEffect, useState } from 'react';

import { PasswordStrengthIndicator as BasePasswordStrengthIndicator, type PasswordScore } from '@proton/atoms';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Unwrap } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

export const loadWasm = () => {
    return import(/* webpackChunkName: "pass-rust-core/password" */ '@protontech/pass-rust-core/password');
};

type PasswordWasm = Unwrap<ReturnType<typeof loadWasm>>;

const context: {
    promise: Promise<boolean> | undefined;
    service: PasswordWasm | undefined;
} = {
    promise: undefined,
    service: undefined,
};

export const usePasswordStrengthIndicator = () => {
    const enabled = useFlag('ChangePasswordStrengthIndicator');
    const [supported, setSupported] = useState(context.service !== undefined);

    useEffect(() => {
        if (!enabled) {
            return;
        }
        if (context.promise === undefined) {
            context.promise = loadWasm()
                .then((value) => {
                    context.service = value;
                    return true;
                })
                .catch((e) => {
                    captureMessage('Pass rust core error', { level: 'info', extra: { message: e.message } });
                    throw e;
                });
        }
        context.promise
            .then(() => {
                setSupported(true);
            })
            .catch(noop);
    }, []);

    return {
        supported: supported && enabled,
    };
};

const defaultScore: PasswordScore = 'Vulnerable';

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    const [score, setScore] = useState<PasswordScore>(defaultScore);

    useEffect(() => {
        const service = context.service;
        if (!service) {
            return;
        }
        try {
            const score = service.check_password_score(password);
            setScore(score);
        } catch (e) {
            setScore(defaultScore);
        }
    }, [password]);

    return <BasePasswordStrengthIndicator score={score} />;
};

export default PasswordStrengthIndicator;
