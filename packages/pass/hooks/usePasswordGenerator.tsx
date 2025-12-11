import { useCallback, useEffect, useMemo, useState } from 'react';

import debounce from 'lodash/debounce';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import {
    DEFAULT_MEMORABLE_PW_OPTIONS,
    DEFAULT_RANDOM_PW_OPTIONS,
    alphabeticChars,
    digitChars,
} from '@proton/pass/lib/password/constants';
import { generatePassword } from '@proton/pass/lib/password/generator';
import type { GeneratePasswordConfig, GeneratePasswordMode } from '@proton/pass/lib/password/types';
import type { MaybeNull, OrganizationUpdatePasswordPolicyInput } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
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
    policy: MaybeNull<OrganizationUpdatePasswordPolicyInput>
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
    policy: MaybeNull<OrganizationUpdatePasswordPolicyInput>
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
    policy?: MaybeNull<OrganizationUpdatePasswordPolicyInput>
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

type PasswordGeneratorOptions = {
    config: MaybeNull<GeneratePasswordConfig>;
    policy: MaybeNull<OrganizationUpdatePasswordPolicyInput>;
    onConfigChange?: (config: GeneratePasswordConfig) => void;
};

export const usePasswordGenerator = (props: PasswordGeneratorOptions) => {
    const { core } = usePassCore();
    const [password, setPassword] = useState('');
    const [config, setConfig] = useState(() =>
        getPasswordConfig(props.config ?? DEFAULT_MEMORABLE_PW_OPTIONS, props.policy)
    );

    const generate = useCallback(
        (opts: GeneratePasswordConfig) => {
            generatePassword(core)(opts).then(setPassword).catch(noop);
        },
        [core]
    );

    /** Debounce the pw options dispatch in order to avoid swarming the
     * `onConfigChange` callback when using the length slider */
    const savePasswordOptions = useCallback(debounce(props.onConfigChange ?? noop, 250), []);

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
            policy: props.policy,
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

                    if (type === 'memorable') return getPasswordConfig(DEFAULT_MEMORABLE_PW_OPTIONS, props.policy);
                    if (type === 'random') return getPasswordConfig(DEFAULT_RANDOM_PW_OPTIONS, props.policy);

                    return prev;
                });
            },
        }),
        [config, password, props.policy]
    );
};

export type PasswordGeneratorResult<T extends GeneratePasswordMode = GeneratePasswordMode> = Omit<
    ReturnType<typeof usePasswordGenerator>,
    'config'
> & { config: GeneratePasswordConfig<T> };

export const isUsingRandomPassword = (result: PasswordGeneratorResult): result is PasswordGeneratorResult<'random'> =>
    result.config.type === 'random';

export const isUsingMemorablePassword = (
    result: PasswordGeneratorResult
): result is PasswordGeneratorResult<'memorable'> => result.config.type === 'memorable';
