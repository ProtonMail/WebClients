import { useEffect, useState } from 'react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Unwrap } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import BasePasswordStrengthIndicator from './BasePasswordStrengthIndicator';
import type { PasswordPenalties, PasswordScore, PasswordStrengthIndicatorVariant } from './interface';

export const loadWasm = () => {
    return import(/* webpackChunkName: "pass-rust-core/password" */ '@protontech/pass-rust-core/password');
};

export type PasswordWasm = Unwrap<ReturnType<typeof loadWasm>>;

const context: {
    promise: Promise<boolean> | undefined;
    service: PasswordWasm | undefined;
} = {
    promise: undefined,
    service: undefined,
};

export const useLoadPasswordStrengthIndicatorWasm = () => {
    const [supported, setSupported] = useState(context.service !== undefined);

    useEffect(() => {
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
        supported: supported,
        service: context.service,
    };
};

const defaultScore: PasswordScore = 'Vulnerable';

interface PasswordStrengthIndicatorProps {
    password: string;
    hideWhenEmpty?: boolean;
    variant?: PasswordStrengthIndicatorVariant;
    className?: string;
    showIllustration?: boolean;
    showGeneratePasswordButton?: boolean;
    service: PasswordWasm | undefined;
}

const passwordConfig = {
    length: 16,
    numbers: true,
    uppercase_letters: true,
    symbols: true,
};

const PasswordStrengthIndicator = ({
    password,
    hideWhenEmpty = true,
    variant = 'compact',
    className,
    showIllustration = true,
    showGeneratePasswordButton = false,
    service,
}: PasswordStrengthIndicatorProps) => {
    const [score, setScore] = useState<PasswordScore>(defaultScore);
    const [penalties, setPenalties] = useState<Set<PasswordPenalties> | undefined>();
    const [generatedPassword, setGeneratedPassword] = useState<string>('');

    useEffect(() => {
        if (!service) {
            return;
        }
        try {
            const analyse = service.analyze_password(password);
            setScore(analyse.password_score);
            setPenalties(new Set(analyse.penalties));
        } catch (e) {
            setScore(defaultScore);
        }
    }, [password]);

    const generatePassword = service
        ? () => {
              try {
                  const newPassword = service.generate_password(passwordConfig);
                  setGeneratedPassword(newPassword);
              } catch (e) {}
          }
        : undefined;

    if (hideWhenEmpty && !password) {
        return;
    }

    return (
        <BasePasswordStrengthIndicator
            rootClassName={className}
            score={score}
            penalties={penalties}
            password={password}
            variant={variant}
            onGeneratePassword={generatePassword}
            generatedPassword={generatedPassword}
            showIllustration={showIllustration}
            showGeneratePasswordButton={showGeneratePasswordButton}
        />
    );
};

export default PasswordStrengthIndicator;
