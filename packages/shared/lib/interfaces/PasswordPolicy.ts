export type PasswordPolicyName =
    | 'AtLeastXCharacters'
    | 'AtLeastOneNumber'
    | 'AtLeastOneSpecialCharacter'
    | 'AtLeastOneUpperCaseAndOneLowercase'
    | 'DisallowSequences'
    | 'DisallowCommonPasswords';

export type PasswordPoliciesState = {
    [K in PasswordPolicyName]: K extends 'AtLeastXCharacters' ? string : PasswordPolicyState;
};

export enum PasswordPolicyState {
    ENABLED = 1,
    OPTIONAL = 2,
}

export interface PasswordPolicy {
    PolicyName: PasswordPolicyName;
    State: PasswordPolicyState;
    RequirementMessage: string;
    ErrorMessage: string;
    Regex: string;
    HideIfValid: boolean;
}

export interface PasswordPolicySetting {
    PolicyName: PasswordPolicyName;
    State: PasswordPolicyState;
    Parameters: { MinimumCharacters: number } | null;
}

export type PasswordPolicies = PasswordPolicy[];
export type PasswordPolicySettings = PasswordPolicySetting[];
