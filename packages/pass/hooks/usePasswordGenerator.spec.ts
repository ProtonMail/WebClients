import { DEFAULT_MEMORABLE_PW_OPTIONS, DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/lib/password/constants';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/types';
import type { OrganizationUpdatePasswordPolicyInput } from '@proton/pass/types';

import { getPasswordConfig } from './usePasswordGenerator';

const DEFAULT_POLICY: OrganizationUpdatePasswordPolicyInput = {
    RandomPasswordAllowed: true,
    RandomPasswordMinLength: null,
    RandomPasswordMaxLength: null,
    RandomPasswordMustIncludeNumbers: null,
    RandomPasswordMustIncludeSymbols: null,
    RandomPasswordMustIncludeUppercase: null,
    MemorablePasswordAllowed: true,
    MemorablePasswordMinWords: null,
    MemorablePasswordMaxWords: null,
    MemorablePasswordMustCapitalize: null,
    MemorablePasswordMustIncludeNumbers: null,
};

describe('getPasswordConfig', () => {
    it('returns the original config if policy is null', () => {
        const randomConfig = DEFAULT_RANDOM_PW_OPTIONS;
        const randomResult = getPasswordConfig(randomConfig, null);
        expect(randomResult).toEqual(randomConfig);

        const memorableConfig = DEFAULT_MEMORABLE_PW_OPTIONS;
        const memorableResult = getPasswordConfig(memorableConfig, null);
        expect(memorableResult).toEqual(memorableConfig);
    });

    it('returns the original config if policy does not enforce any rule', () => {
        const randomConfig = DEFAULT_RANDOM_PW_OPTIONS;
        const randomResult = getPasswordConfig(randomConfig, DEFAULT_POLICY);
        expect(randomResult).toEqual(randomConfig);

        const memorableConfig = DEFAULT_MEMORABLE_PW_OPTIONS;
        const memorableResult = getPasswordConfig(memorableConfig, DEFAULT_POLICY);
        expect(memorableResult).toEqual(memorableConfig);
    });

    it('returns a different config type if policy does not allow the current config type', () => {
        const randomConfig = DEFAULT_RANDOM_PW_OPTIONS;
        const randomPolicy: OrganizationUpdatePasswordPolicyInput = {
            ...DEFAULT_POLICY,
            RandomPasswordAllowed: false,
        };
        const randomResult = getPasswordConfig(randomConfig, randomPolicy);
        expect(randomResult.type).toBe('memorable');

        const memorableConfig = DEFAULT_MEMORABLE_PW_OPTIONS;
        const memorablePolicy: OrganizationUpdatePasswordPolicyInput = {
            ...DEFAULT_POLICY,
            MemorablePasswordAllowed: false,
        };
        const memorableResult = getPasswordConfig(memorableConfig, memorablePolicy);
        expect(memorableResult.type).toBe('random');
    });

    it('enforces policy for random password', () => {
        const randomConfig = DEFAULT_RANDOM_PW_OPTIONS;
        const policy: OrganizationUpdatePasswordPolicyInput = {
            ...DEFAULT_POLICY,
            RandomPasswordMinLength: 63,
            RandomPasswordMustIncludeNumbers: false,
            RandomPasswordMustIncludeUppercase: true,
            RandomPasswordMustIncludeSymbols: null,
        };
        const result = getPasswordConfig(randomConfig, policy) as GeneratePasswordConfig<'random'>;
        expect(result.options.length).toBe(63);
        expect(result.options.useDigits).toBe(false);
        expect(result.options.useUppercase).toBe(true);
        expect(result.options.useSpecialChars).toBe(randomConfig.options.useSpecialChars);
    });

    it('enforces policy for memorable password', () => {
        const memorableConfig = DEFAULT_MEMORABLE_PW_OPTIONS;
        const policy: OrganizationUpdatePasswordPolicyInput = {
            ...DEFAULT_POLICY,
            MemorablePasswordMinWords: 9,
            MemorablePasswordMustCapitalize: false,
            MemorablePasswordMustIncludeNumbers: null,
        };
        const result = getPasswordConfig(memorableConfig, policy) as GeneratePasswordConfig<'memorable'>;
        expect(result.options.wordCount).toBe(9);
        expect(result.options.capitalize).toBe(false);
        expect(result.options.extraNumbers).toBe(memorableConfig.options.extraNumbers);
    });

    it('enforces max length policy for random password', () => {
        const randomConfig = DEFAULT_RANDOM_PW_OPTIONS;
        const policy: OrganizationUpdatePasswordPolicyInput = {
            ...DEFAULT_POLICY,
            RandomPasswordMinLength: 4,
            RandomPasswordMaxLength: 4,
        };
        const result = getPasswordConfig(randomConfig, policy) as GeneratePasswordConfig<'random'>;
        expect(result.options.length).toBe(4);
    });

    it('enforces max words policy for memorable password', () => {
        const memorableConfig = DEFAULT_MEMORABLE_PW_OPTIONS;
        const policy: OrganizationUpdatePasswordPolicyInput = {
            ...DEFAULT_POLICY,
            MemorablePasswordMinWords: 1,
            MemorablePasswordMaxWords: 2,
        };
        const result = getPasswordConfig(memorableConfig, policy) as GeneratePasswordConfig<'memorable'>;
        expect(result.options.wordCount).toBe(2);
    });
});
