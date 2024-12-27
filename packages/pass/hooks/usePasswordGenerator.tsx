import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import {
    DEFAULT_MEMORABLE_PW_OPTIONS,
    DEFAULT_RANDOM_PW_OPTIONS,
    alphabeticChars,
    digitChars,
} from '@proton/pass/lib/password/constants';
import { generatePassword } from '@proton/pass/lib/password/generator';
import type { GeneratePasswordConfig, GeneratePasswordMode } from '@proton/pass/lib/password/types';
import type { MaybeNull, OrganizationUpdatePasswordPolicyRequest } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export enum CharType {
    Alphabetic,
    Digit,
    Special,
}

/* Designers mixed the colors of different ui-${type}
 * sub-themes for the character colors.. */
export const charTypeToClassName = {
    [CharType.Alphabetic]: '',
    [CharType.Digit]: 'ui-violet pass-password-generator--char-digit',
    [CharType.Special]: 'ui-teal pass-password-generator--char-special',
};

export const getTypeFromChar = (char: string) => {
    if (alphabeticChars.includes(char)) return CharType.Alphabetic;
    if (digitChars.includes(char)) return CharType.Digit;

    return CharType.Special;
};

export const getCharsGroupedByColor = (password: string) => {
    if (password.length === 0) return [];

    const [head, ...chars] = Array.from(password);
    const startType = getTypeFromChar(head);

    return chars
        .reduce(
            (state, currentChar) => {
                const currentElement = state[state.length - 1];
                const previousType = currentElement.color;
                const currentType = getTypeFromChar(currentChar);

                return previousType !== currentType
                    ? [...state, { color: currentType, content: currentChar }]
                    : [...state.slice(0, -1), { color: previousType, content: currentElement.content + currentChar }];
            },
            [{ color: startType, content: head }]
        )
        .map(({ color, content }, index) => (
            <span className={charTypeToClassName[color]} key={index}>
                {content}
            </span>
        ));
};

const getRandomPasswordConfig = (
    config: GeneratePasswordConfig<'random'>,
    policy: MaybeNull<OrganizationUpdatePasswordPolicyRequest>
): GeneratePasswordConfig => {
    return {
        type: 'random',
        options: {
            length: Math.min(
                policy?.RandomPasswordMaxLength ?? 99,
                Math.max(policy?.RandomPasswordMinLength ?? 0, config.options.length)
            ),
            useDigits: policy?.RandomPasswordMustIncludeNumbers ?? config.options.useDigits,
            useSpecialChars: policy?.RandomPasswordMustIncludeSymbols ?? config.options.useSpecialChars,
            useUppercase: policy?.RandomPasswordMustIncludeUppercase ?? config.options.useUppercase,
        },
    };
};

const getMemorablePasswordConfig = (
    config: GeneratePasswordConfig<'memorable'>,
    policy: MaybeNull<OrganizationUpdatePasswordPolicyRequest>
): GeneratePasswordConfig => {
    return {
        type: 'memorable',
        options: {
            wordCount: Math.min(
                policy?.MemorablePasswordMaxWords ?? 99,
                Math.max(policy?.MemorablePasswordMinWords ?? 0, config.options.wordCount)
            ),
            capitalize: policy?.MemorablePasswordMustCapitalize ?? config.options.capitalize,
            extraNumbers: policy?.MemorablePasswordMustIncludeNumbers ?? config.options.extraNumbers,
            seperator: config.options.seperator,
        },
    };
};

/** If the current config type is not allowed by policy, create new config,
 * else update the current config */
export const getPasswordConfig = (
    config: GeneratePasswordConfig,
    policy?: MaybeNull<OrganizationUpdatePasswordPolicyRequest>
): GeneratePasswordConfig => {
    if (!policy) return config;

    switch (config.type) {
        case 'random':
            return policy.RandomPasswordAllowed === false
                ? getMemorablePasswordConfig(DEFAULT_MEMORABLE_PW_OPTIONS, policy)
                : getRandomPasswordConfig(config, policy);
        case 'memorable':
            return policy.MemorablePasswordAllowed === false
                ? getRandomPasswordConfig(DEFAULT_RANDOM_PW_OPTIONS, policy)
                : getMemorablePasswordConfig(config, policy);
    }
};

type UsePasswordGeneratorOptions = {
    initial: MaybeNull<GeneratePasswordConfig>;
    policy: MaybeNull<OrganizationUpdatePasswordPolicyRequest>;
    onConfigChange: (options: GeneratePasswordConfig) => void;
};

export const usePasswordGenerator = ({ initial, policy, onConfigChange }: UsePasswordGeneratorOptions) => {
    const { core } = usePassCore();

    const [password, setPassword] = useState('');
    const [config, setConfig] = useState<GeneratePasswordConfig>(() =>
        getPasswordConfig(initial ?? DEFAULT_MEMORABLE_PW_OPTIONS, policy)
    );

    const generate = useCallback(
        (opts: GeneratePasswordConfig) => {
            generatePassword(core)(opts).then(setPassword).catch(noop);
        },
        [core]
    );

    /** Debounce the pw options dispatch in order to avoid swarming the
     * store with updates when using the length slider */
    const savePasswordOptions = useCallback(debounce(onConfigChange, 250), []);

    useEffect(() => setConfig((config) => getPasswordConfig(config, policy)), [policy]);

    /** Regenerates password when config changes. Uses `Object.values()` to track option changes.
     * WARNING: Assumes both password types have same number of options - will cause dependency
     * array mismatch if this changes in the future. */
    useEffect(() => {
        generate(config);
        savePasswordOptions(config);
    }, [config.type, ...Object.values(config.options)]);

    return useMemo(
        () => ({
            config,
            password,
            policy,
            regeneratePassword: () => generate(config),
            setPasswordOptions: <
                Type extends GeneratePasswordConfig['type'],
                Options = Extract<GeneratePasswordConfig, { type: Type }>['options'],
            >(
                type: Type,
                update?: Partial<Options>
            ) => {
                setConfig((prev) => {
                    if (prev.type === type && update) {
                        const updatedKeys = Object.keys(update) as (keyof Options)[];
                        const prevOptions = prev.options as Options;
                        const didChange = updatedKeys.some((key) => update[key] !== prevOptions[key]);
                        return didChange ? merge(prev, { options: update }) : prev;
                    }

                    if (type === 'memorable') return getPasswordConfig(DEFAULT_MEMORABLE_PW_OPTIONS, policy);
                    if (type === 'random') return getPasswordConfig(DEFAULT_RANDOM_PW_OPTIONS, policy);

                    return prev;
                });
            },
        }),
        [config, password, policy]
    );
};

export type UsePasswordGeneratorResult<T extends GeneratePasswordMode = GeneratePasswordMode> = Omit<
    ReturnType<typeof usePasswordGenerator>,
    'config'
> & { config: GeneratePasswordConfig<T> };

export const isUsingRandomPassword = (
    result: UsePasswordGeneratorResult
): result is UsePasswordGeneratorResult<'random'> => result.config.type === 'random';

export const isUsingMemorablePassword = (
    result: UsePasswordGeneratorResult
): result is UsePasswordGeneratorResult<'memorable'> => result.config.type === 'memorable';
