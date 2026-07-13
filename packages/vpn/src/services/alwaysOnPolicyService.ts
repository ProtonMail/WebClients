import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { queryAlwaysOnPolicy, updateAlwaysOnPolicy } from '../apis/alwaysOn';
import type { AlwaysOnPolicy, AlwaysOnPolicyResponse, UpdateAlwaysOnPolicyData } from '../types/AlwaysOn';

export interface AlwaysOnPolicyService {
    /** Returns the current policy, or `null` when one was never configured (backend `204`). */
    fetchPolicy: () => Promise<AlwaysOnPolicy | null>;
    /** Creates or updates the policy and returns the resulting state. */
    updatePolicy: (data: UpdateAlwaysOnPolicyData) => Promise<AlwaysOnPolicy>;
}

export const getAlwaysOnPolicyService = (api: Api): AlwaysOnPolicyService => ({
    fetchPolicy: async () => {
        // `output: 'raw'` so we can tell `204` (never configured) from `200` (policy exists).
        const response: Response = await api({ ...queryAlwaysOnPolicy(), output: 'raw' });
        if (response.status === HTTP_STATUS_CODE.NO_CONTENT) {
            return null;
        }
        return response.json() as Promise<AlwaysOnPolicyResponse>;
    },
    updatePolicy: (data) => api<AlwaysOnPolicyResponse>(updateAlwaysOnPolicy(data)),
});
