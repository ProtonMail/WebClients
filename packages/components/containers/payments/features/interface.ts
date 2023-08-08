import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import { IconName } from '../../../components';

export interface PlanCardFeatureDefinition {
    text: string | string[];
    included: boolean;
    hideInDowngrade?: boolean;
    status?: 'available' | 'coming-soon';
    tooltip?: string;
    highlight?: boolean;
    icon?: IconName;
}

export interface PlanCardFeature {
    name: string;
    /* If targeting a specific audience */
    target?: Audience;
    plans: {
        [PLANS.FREE]: PlanCardFeatureDefinition | null;
        [PLANS.BUNDLE]: PlanCardFeatureDefinition | null;
        [PLANS.MAIL]: PlanCardFeatureDefinition | null;
        [PLANS.VPN]: PlanCardFeatureDefinition | null;
        [PLANS.DRIVE]: PlanCardFeatureDefinition | null;
        [PLANS.PASS_PLUS]: PlanCardFeatureDefinition | null;
        [PLANS.FAMILY]: PlanCardFeatureDefinition | null;
        [PLANS.MAIL_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.BUNDLE_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.VPN_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.VPN_BUSINESS]: PlanCardFeatureDefinition | null;
    };
}

export enum PlanCardFeatureType {
    highlight,
    mail,
    calendar,
    drive,
    vpn,
    team,
    support,
}

export interface ShortPlan {
    label: string;
    description: string;
    title: string;
    plan:
        | PLANS.FREE
        | PLANS.BUNDLE
        | PLANS.MAIL
        | PLANS.DRIVE
        | PLANS.PASS_PLUS
        | PLANS.BUNDLE_PRO
        | PLANS.MAIL_PRO
        | PLANS.VPN
        | PLANS.NEW_VISIONARY
        | PLANS.FAMILY
        | PLANS.VPN_PRO
        | PLANS.VPN_BUSINESS;
    cta: string;
    features: PlanCardFeatureDefinition[];
}

/**
 * Can be used for UI-only plans. For example, the enterprise-talk-to-us plan doesn't exist on the backend,
 * but we still want to display it in the UI.
 */
export type ShortPlanLike = {
    plan: string;
    cta?: string;
    isPlanLike: true;
} & Pick<ShortPlan, 'label' | 'description' | 'title' | 'features'>;

export function isShortPlanLike(plan: any): plan is ShortPlanLike {
    return !!plan && plan.isPlanLike;
}
