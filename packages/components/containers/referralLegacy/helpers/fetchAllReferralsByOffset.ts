import { getReferrals } from '@proton/shared/lib/api/core/referrals';
import type { Api, Referral } from '@proton/shared/lib/interfaces';
import range from '@proton/utils/range';

interface ReferralApiResult {
    Total: number;
    Referrals: Referral[];
}

const fetchAllReferralsByOffset = async (
    api: Api,
    params?: { Offset?: number; Limit?: number }
): Promise<ReferralApiResult> => {
    const offset = params?.Offset ?? 0;
    const limit = params?.Limit ?? 100;

    const firstResults = await api<ReferralApiResult>(getReferrals({ Offset: offset, Limit: limit }));
    const total = firstResults.Total;

    if (!total || limit > total) {
        return firstResults;
    }

    const referrals = [...(firstResults?.Referrals || [])];
    const numberOfCalls = Math.ceil((total - limit) / limit);

    const promises = range(0, numberOfCalls).map((_, index) => {
        const nextOffset = limit * (index + 1);

        return api<ReferralApiResult>(getReferrals({ Offset: nextOffset, Limit: limit }));
    });

    const nextResults = await Promise.all(promises);

    nextResults.forEach((nextResult) => {
        referrals.push(...(nextResult?.Referrals || []));
    });

    return {
        Referrals: referrals,
        Total: total,
    };
};

export default fetchAllReferralsByOffset;
