import { useCallback, useState } from 'react';

import metrics, { observeApiError } from '@proton/metrics/index';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import type { Api, ReferralData } from '@proton/shared/lib/interfaces';

export class InvalidReferrerError extends Error {
    name = 'InvalidReferrerError';
}

/**
 * Handles referral state and exposes referral
 */
export const useReferralData = () => {
    const [referralData, setReferralData] = useState<ReferralData>();

    /**
     * Sets referralData state if valid identifier
     * Throws error if identifier is invalid
     */
    const initReferralData = useCallback(
        async ({ unverifiedReferralData, api }: { unverifiedReferralData: ReferralData; api: Api }) => {
            try {
                /**
                 * CheckReferrer will throw with status code 404 if the referralIdentifier is invalid
                 */
                await api<{ Domains: string[] }>(checkReferrer(unverifiedReferralData.referralIdentifier));
                setReferralData(unverifiedReferralData);

                metrics.core_referral_identifier_initialization_total.increment({
                    status: 'success',
                });
            } catch (error) {
                const { status } = getApiError(error);

                if (status === HTTP_STATUS_CODE.NOT_FOUND) {
                    metrics.core_referral_identifier_initialization_total.increment({
                        status: 'referral-code-no-found',
                    });
                    throw new InvalidReferrerError('Referral code not found');
                }

                observeApiError(error, (status) =>
                    metrics.core_referral_identifier_initialization_total.increment({
                        status,
                    })
                );
                throw error;
            }
        },
        []
    );

    return { referralData, initReferralData };
};
