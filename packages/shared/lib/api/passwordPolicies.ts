import type { Api } from '../interfaces';

export const AllPasswordPolicies = [
    'AtLeastXCharacters',
    'AtLeastOneNumber',
    'AtLeastOneSpecialCharacter',
    'AtLeastOneUpperCaseAndOneLowercase',
    'DisallowSequences',
    'DisallowCommonPasswords',
] as const;

export enum PasswordPolicyState {
    ENABLED = 1,
    OPTIONAL = 2,
}

export interface PasswordPolicy {
    PolicyName: string;
    State: PasswordPolicyState;
    RequirementMessage: string;
    ErrorMessage: string;
    Regex: string;
}

export interface PasswordPolicies {
    PasswordPolicies: PasswordPolicy[];
}

export const getPasswordPolicies = () => ({
    method: 'get',
    url: `auth/v4/password-policies`,
});

export const getAllPasswordPolicies = async (api: Api): Promise<PasswordPolicy[]> => {
    try {
        const { PasswordPolicies } = await api<PasswordPolicies>({
            silence: true,
            ...getPasswordPolicies(),
        });
        return PasswordPolicies;
    } catch {
        return [];
    }
};

export type AllPasswordPolicyKeys = (typeof AllPasswordPolicies)[number];

export type PolicyStateType = {
    [K in AllPasswordPolicyKeys]: K extends 'AtLeastXCharacters' ? string : PasswordPolicyState;
};

export type SerializedPolicy = {
    PolicyName: keyof PolicyStateType;
    State: PasswordPolicyState;
    Parameters: Record<string, any> | null;
};

export const serializePolicyState = (state: PolicyStateType): SerializedPolicy[] => {
    return Object.entries(state).map(([key, value]) => {
        if (key === 'AtLeastXCharacters') {
            return {
                PolicyName: key,
                State: PasswordPolicyState.ENABLED,
                Parameters: {
                    MinimumCharacters: Number(value),
                },
            };
        }

        return {
            PolicyName: key as keyof PolicyStateType,
            State: value as PasswordPolicyState,
            Parameters: null,
        };
    });
};
