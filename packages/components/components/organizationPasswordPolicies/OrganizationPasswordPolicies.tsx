import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcCheckmark } from '@proton/icons';
import type { AllPasswordPolicyKeys } from '@proton/shared/lib/api/passwordPolicies';
import {
    type PasswordPolicy,
    PasswordPolicyState,
    getAllPasswordPolicies,
} from '@proton/shared/lib/api/passwordPolicies';
import type { Api } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { PasswordWasm } from '../passwordStrengthIndicator/PasswordStrengthIndicator';
import PasswordStrengthIndicator, {
    usePasswordStrengthIndicator,
} from '../passwordStrengthIndicator/PasswordStrengthIndicator';
import Spotlight from '../spotlight/Spotlight';

type ValidationResult = {
    policy: AllPasswordPolicyKeys;
    passed: boolean;
    message: string | null;
};

export function useOrganizationPasswordPolicyValidation(
    password: string,
    api: Api | undefined
): {
    displayed: boolean;
    validationResults: ValidationResult[];
    passwordRequirementsMatched: boolean;
    spotlight: boolean;
    onInputFocus: () => void;
    onInputBlur: () => void;
    inputFocused: boolean;
    strengthIndicatorSupported: boolean;
    strengthIndicatorService: PasswordWasm | undefined;
} {
    const passwordStrengthIndicator = usePasswordStrengthIndicator();
    const { viewportWidth } = useActiveBreakpoint();
    const [inputFocused, setInputFocus] = useState(false);
    const [requirements, setRequirements] = useState<PasswordPolicy[]>([]);

    useEffect(() => {
        if (!api) {
            return;
        }

        const fetchPolicies = async () => {
            try {
                const result = await getAllPasswordPolicies(api);
                setRequirements(result);
            } catch (error) {}
        };

        void fetchPolicies();
    }, [api]);

    const validationResults = useMemo(() => {
        if (!requirements) {
            return [];
        }
        return requirements
            .filter((req) => req.State === PasswordPolicyState.ENABLED) // Only test for enabled policies
            .map((req) => {
                const policyName = req.PolicyName;

                const pattern = req.Regex.replace(/^\/|\/$/g, ''); // remove leading/trailing slashes
                const regex = new RegExp(pattern);
                const passed = regex.test(password);

                return {
                    policy: policyName as AllPasswordPolicyKeys,
                    passed,
                    message: req.RequirementMessage,
                    errorMessage: passed ? null : req.ErrorMessage,
                };
            });
    }, [password, requirements]);

    const passwordRequirementsMatched = useMemo(() => {
        return validationResults.every((res) => res.passed);
    }, [validationResults]);

    const displayed = useMemo(() => {
        if (requirements.length === 0) {
            return false;
        }
        return true;
    }, [requirements]);

    return {
        displayed,
        validationResults,
        passwordRequirementsMatched,
        spotlight: viewportWidth.xlarge || viewportWidth['2xlarge'],
        onInputFocus: () => setInputFocus(true),
        onInputBlur: () => setInputFocus(false),
        inputFocused,
        strengthIndicatorSupported: passwordStrengthIndicator.supported,
        strengthIndicatorService: passwordStrengthIndicator.service,
    };
}

interface OrganizationPasswordPoliciesProps {
    password: string;
    wrapper: ReturnType<typeof useOrganizationPasswordPolicyValidation>;
    variant?: 'default' | 'large';
}

export const OrganizationPasswordPolicies = ({
    password,
    wrapper,
    variant = 'default',
}: OrganizationPasswordPoliciesProps) => {
    return (
        <div className={clsx('flex w-full', variant === 'large' && 'items-center p-5')}>
            {wrapper.strengthIndicatorSupported ? (
                <PasswordStrengthIndicator
                    password={password}
                    hideWhenEmpty={false}
                    variant="strengthOnly"
                    showIllustration={variant === 'large'}
                    service={wrapper.strengthIndicatorService}
                />
            ) : undefined}

            <h4
                className={clsx(
                    'mt-0 mb-1 w-full',
                    variant === 'default' && 'text-sm',
                    variant === 'large' && 'text-rg'
                )}
            >{c('Info').t`Password must have:`}</h4>
            <ul className={clsx('unstyled flex flex-column gap-1 m-0', variant === 'default' && 'text-sm')}>
                {wrapper.validationResults.map((result) => {
                    // To be replaced by a hideUntilMatched in the policy itself
                    const hideUntilMatched = ['DisallowSequences', 'DisallowCommonPasswords'].includes(result.policy);

                    if (result.passed && hideUntilMatched) {
                        return null;
                    }

                    return (
                        <li
                            key={result.policy}
                            className={clsx(
                                'flex flex-nowrap gap-2 items-center',
                                result.passed && 'text-strike color-hint'
                            )}
                        >
                            <span className="w-4 p-px shrink-0">
                                <span
                                    className={clsx(
                                        'flex items-center justify-center border rounded-full ratio-square',
                                        result.passed && 'border-primary'
                                    )}
                                >
                                    {result.passed && (
                                        <IcCheckmark className="shrink-0 color-primary scale-fade-in" size={3} />
                                    )}
                                </span>
                            </span>

                            <span>{result.message}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

interface OrganizationPasswordPoliciesSpotlightProps {
    password: string;
    children: ReactNode;
    anchorRef: MutableRefObject<HTMLElement | null>;
    validationResults: ValidationResult[];
    wrapper: ReturnType<typeof useOrganizationPasswordPolicyValidation>;
}

export const OrganizationPasswordPoliciesSpotlight = ({
    password,
    children,
    anchorRef,
    wrapper,
    validationResults,
}: OrganizationPasswordPoliciesSpotlightProps) => {
    if (validationResults.length === 0) {
        return children;
    }

    if (!wrapper.spotlight) {
        return (
            <>
                {children}
                {<OrganizationPasswordPolicies password={password} wrapper={wrapper} />}
            </>
        );
    }

    return (
        <Spotlight
            originalPlacement="right"
            show={wrapper.inputFocused}
            anchorRef={anchorRef}
            hasClose={false}
            content={<OrganizationPasswordPolicies password={password} wrapper={wrapper} />}
        >
            {children}
        </Spotlight>
    );
};
