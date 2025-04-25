import type { PasswordPolicyName } from '@proton/shared/lib/interfaces';

export type PasswordPolicyValidationResult = {
    policy: PasswordPolicyName;
    valid: boolean;
    requirementMessage: string | null;
    errorMessage: string | null;
    hideIfValid: boolean;
};
