import type { ComponentProps, MutableRefObject, ReactNode } from 'react';

import { c } from 'ttag';

import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';

import PasswordStrengthIndicator from '../passwordStrengthIndicator/PasswordStrengthIndicator';
import Spotlight from '../spotlight/Spotlight';
import type { PasswordPolicyValidationResult } from './interface';
import type { PasswordPolicyValidationHookResult } from './usePasswordPolicyValidation';

interface PasswordPolicyProps {
    password: string;
    wrapper: PasswordPolicyValidationHookResult;
    variant?: 'default' | 'large';
    className?: string;
}

export const PasswordPolicy = ({ className, password, wrapper, variant = 'default' }: PasswordPolicyProps) => {
    return (
        <div className={clsx('flex w-full', variant === 'large' && 'items-center p-5', className)}>
            {wrapper.passwordStrengthIndicator.supported ? (
                <PasswordStrengthIndicator
                    password={password}
                    hideWhenEmpty={false}
                    variant="strengthOnly"
                    showIllustration={variant === 'large'}
                    service={wrapper.passwordStrengthIndicator.service}
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
                {wrapper.result.map((result) => {
                    if (result.valid && result.hideIfValid) {
                        return null;
                    }

                    return (
                        <li
                            key={result.policy}
                            className={clsx(
                                'flex flex-nowrap gap-2 items-center',
                                result.valid && 'text-strike color-hint'
                            )}
                        >
                            <span className="w-4 p-px shrink-0">
                                <span
                                    className={clsx(
                                        'flex items-center justify-center border rounded-full ratio-square',
                                        result.valid && 'border-primary'
                                    )}
                                >
                                    {result.valid && (
                                        <IcCheckmark className="shrink-0 color-primary scale-fade-in" size={3} />
                                    )}
                                </span>
                            </span>

                            <span>{result.requirementMessage}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

interface PasswordPolicySpotlightProps {
    password: string;
    enabled: boolean;
    children: ReactNode;
    anchorRef: MutableRefObject<HTMLElement | null>;
    validationResults: PasswordPolicyValidationResult[];
    wrapper: PasswordPolicyValidationHookResult;
    isAboveModal: ComponentProps<typeof Spotlight>['isAboveModal'];
}

export const PasswordPolicySpotlight = ({
    password,
    children,
    anchorRef,
    wrapper,
    validationResults,
    enabled,
    isAboveModal,
}: PasswordPolicySpotlightProps) => {
    if (!enabled || validationResults.length === 0) {
        return children;
    }

    if (!wrapper.spotlight) {
        return (
            <>
                {children}
                {<PasswordPolicy password={password} className="pt-1 pb-4" wrapper={wrapper} />}
            </>
        );
    }

    return (
        <Spotlight
            originalPlacement="right"
            show={wrapper.inputFocused}
            anchorRef={anchorRef}
            hasClose={false}
            content={<PasswordPolicy password={password} wrapper={wrapper} />}
            isAboveModal={isAboveModal}
        >
            {children}
        </Spotlight>
    );
};
