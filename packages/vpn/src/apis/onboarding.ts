import type { Api } from '@proton/shared/lib/interfaces';

interface IsBusinessOnboardedResponse {
    /**
     * `string` or `null` (Immutable once set - never changes after first interaction)
     * - **ISO 8601** timestamp of first interaction with business features.
     * - Null if the organization has never interacted with business features.
     *
     * e.g.
     * `2025-10-15T12:34:56.789Z`
     */
    FirstInteractionTime: string | null;
    Code: number;
}

interface BusinessOnboardedResponse {
    Code: number;
}

export const getIsBusinessOnboarded = async ({ api }: { api: Api }) => {
    const { FirstInteractionTime } = await api<IsBusinessOnboardedResponse>({
        url: `vpn/v1/business/onboard`,
        method: 'get',
    });

    return !!FirstInteractionTime;
};

/**
 * Organizations can be marked as "onboarded" in two ways:
 *
 * Explicitly dismissing the onboarding (calls **this function**) - Any user clicks a dismiss/skip button
 *
 * Implicitly through feature usage - Any user directly accesses and uses any business feature (creating gateways, changing settings, etc.)
 */
export const setBusinessOnboarded = ({ api }: { api: Api }) =>
    api<BusinessOnboardedResponse>({
        url: `vpn/v1/business/onboard/dismiss`,
        method: 'post',
    });
