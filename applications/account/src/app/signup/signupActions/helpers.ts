import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { HumanVerificationData } from '../interfaces';

export const hvHandler = (error: any, trigger: HumanVerificationData['trigger']): HumanVerificationData => {
    const { code, details } = getApiError(error);
    if (code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED) {
        if (!details?.HumanVerificationToken) {
            throw error;
        }
        return {
            title: details.Title,
            methods: details.HumanVerificationMethods || [],
            token: details.HumanVerificationToken || '',
            trigger,
        };
    }
    throw error;
};
