import { useCallback, useMemo, useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { type PasswordPolicies, PasswordPolicyState } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { useLoadPasswordStrengthIndicatorWasm } from '../passwordStrengthIndicator/PasswordStrengthIndicator';
import type { PasswordPolicyValidationResult } from './interface';

const getIsPasswordPoliciesActive = (passwordPolicies: PasswordPolicies | undefined) => {
    if (!passwordPolicies || passwordPolicies.length === 0) {
        return false;
    }
    // Check if all password policies are the default values
    return passwordPolicies.some((policy) => {
        // The default for 'at least x characters' is that it's expected to be enabled and have a min length of 8
        if (
            policy.PolicyName === 'AtLeastXCharacters' &&
            policy.State === PasswordPolicyState.ENABLED &&
            policy.Regex.includes('{8,}')
        ) {
            return false;
        }
        // Otherwise, all password policies are expected to be optional
        if (policy.State === PasswordPolicyState.OPTIONAL) {
            return false;
        }
        // Otherwise, if any other policy has been set to enabled, it's a non default password policy
        return policy.State === PasswordPolicyState.ENABLED;
    });
};

const getParsedPolicies = (passwordPolicies: PasswordPolicies | undefined) => {
    if (!passwordPolicies) {
        return [];
    }
    return passwordPolicies
        .filter((passwordPolicy) => passwordPolicy.State === PasswordPolicyState.ENABLED) // Only test for enabled policies
        .map((req) => {
            const policyName = req.PolicyName;

            const pattern = req.Regex.replace(/^\/|\/$/g, ''); // remove leading/trailing slashes
            const regex = new RegExp(pattern);

            return {
                regex,
                policy: policyName,
                requirementMessage: req.RequirementMessage,
                errorMessage: req.ErrorMessage,
                hideIfValid: req.HideIfValid,
            };
        });
};

const getResult = (password: string, parsedPolicies: ReturnType<typeof getParsedPolicies>) => {
    const result = parsedPolicies.map((policy): PasswordPolicyValidationResult => {
        const valid = policy.regex.test(password);
        return {
            ...policy,
            valid,
            errorMessage: valid ? null : policy.errorMessage,
        };
    });

    // No policies exist, it'll automatically be valid
    const valid = !parsedPolicies.length ? true : !result.some((res) => !res.valid);

    return {
        result,
        valid,
    };
};

export interface PasswordPolicyValidationHookResult {
    enabled: boolean;
    result: PasswordPolicyValidationResult[];
    valid: boolean;
    spotlight: boolean;
    handlers: {
        onInputFocus: () => void;
        onInputBlur: () => void;
    };
    inputFocused: boolean;
    passwordStrengthIndicator: ReturnType<typeof useLoadPasswordStrengthIndicatorWasm>;
}

export const usePasswordPolicyValidation = (
    password: string,
    passwordPolicies: PasswordPolicies | undefined
): PasswordPolicyValidationHookResult => {
    const featureEnabled = useFlag('PasswordPolicy');
    const passwordStrengthIndicator = useLoadPasswordStrengthIndicatorWasm();
    const { viewportWidth } = useActiveBreakpoint();
    const [inputFocused, setInputFocus] = useState(false);

    const { hasActivePolicies, parsedPolicies } = useMemo(() => {
        const hasActivePolicies = getIsPasswordPoliciesActive(passwordPolicies);
        const parsedPolicies = hasActivePolicies ? getParsedPolicies(passwordPolicies) : [];
        return { hasActivePolicies, parsedPolicies };
    }, [passwordPolicies]);

    const { result, valid } = useMemo(() => {
        return getResult(password, parsedPolicies);
    }, [password, parsedPolicies]);

    const enabled = featureEnabled && hasActivePolicies;

    return {
        enabled,
        result,
        // Only care about the valid value if it's enabled. Otherwise it's always valid.
        valid: enabled ? valid : true,
        spotlight: viewportWidth.xlarge || viewportWidth['2xlarge'],
        handlers: {
            onInputFocus: useCallback(() => setInputFocus(true), []),
            onInputBlur: useCallback(() => setInputFocus(false), []),
        },
        inputFocused,
        passwordStrengthIndicator,
    };
};
