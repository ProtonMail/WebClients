import { PLANS } from '@proton/payments/core/constants';

// These three plans and nothing else. Every other plan is excluded on purpose, including the Workspace
// ones that also reach the VPN settings app: there "Last activity" reads as account-wide rather than
// VPN-only, and a gateway monitor cannot be set up until a dedicated server has been procured.
const plansWithUsageColumns = new Set<PLANS>([
    PLANS.VPN_PRO, // VPN Essentials
    PLANS.VPN_BUSINESS, // VPN Professional
    PLANS.VPN_PASS_BUNDLE_BUSINESS, // VPN and Pass Professional
]);

// Takes the plan from the organization rather than the subscription, which is only fetched for paying
// admins. Free organizations are a stub without a PlanName, hence the undefined case.
export const planHasUsageColumns = (planName: PLANS | undefined) => !!planName && plansWithUsageColumns.has(planName);
