import { isPaid } from '@proton/shared/lib/user/helpers';

import type { Api, PasswordPolicies, User } from '../interfaces';

// Only doing password policies for users in an org as of 25.04.2025
export const getShouldUsePasswordPolicies = (user: User) => {
    return isPaid(user);
};

export const getPasswordPolicies = async ({ api }: { api: Api }): Promise<PasswordPolicies> => {
    try {
        const { PasswordPolicies } = await api<{ PasswordPolicies: PasswordPolicies }>({
            silence: true,
            method: 'get',
            url: `auth/v4/password-policies`,
        });
        return PasswordPolicies;
    } catch {
        return [];
    }
};
