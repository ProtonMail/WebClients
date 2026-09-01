import type { ReactNode } from 'react';

import type { IconComponent } from '@proton/icons/component';
import type { PLANS } from '@proton/payments/core/constants';
import type { Audience } from '@proton/shared/lib/interfaces';

export type PlanCardFeatureIcon = IconComponent;

export interface PlanCardFeatureDefinition {
    /**
     * Stable identifier, unique within any list the feature can be rendered in. It is
     * the React key at every render site, and the only thing business logic should
     * match a feature on: `icon` and `text` are free to change for cosmetic reasons.
     */
    id: string;
    text: ReactNode;
    subtext?: string;
    included: boolean;
    hideInDowngrade?: boolean;
    status?: 'available' | 'coming-soon';
    tooltip?: string;
    highlight?: boolean;
    icon?: PlanCardFeatureIcon;
    iconUrl?: string;
    highResIcon?: string;
    isAddon?: boolean;
}

export interface StandardPlanCardFeatureDefinition extends PlanCardFeatureDefinition {
    text: string;
    icon: PlanCardFeatureIcon;
}

export interface PlanCardFeature {
    name: string;
    /* If targeting a specific audience */
    target?: Audience;
    plans: {
        [PLANS.FREE]: PlanCardFeatureDefinition | null;
        [PLANS.BUNDLE]: PlanCardFeatureDefinition | null;
        [PLANS.MAIL]: PlanCardFeatureDefinition | null;
        [PLANS.VPN2024]: PlanCardFeatureDefinition | null;
        [PLANS.DRIVE]: PlanCardFeatureDefinition | null;
        [PLANS.DRIVE_1TB]: PlanCardFeatureDefinition | null;
        [PLANS.DRIVE_BUSINESS]: PlanCardFeatureDefinition | null;
        [PLANS.PASS]: PlanCardFeatureDefinition | null;
        [PLANS.PASS_LIFETIME]: PlanCardFeatureDefinition | null;
        [PLANS.FAMILY]: PlanCardFeatureDefinition | null;
        [PLANS.DUO]: PlanCardFeatureDefinition | null;
        [PLANS.MAIL_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.MAIL_BUSINESS]: PlanCardFeatureDefinition | null;
        [PLANS.BUNDLE_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.BUNDLE_PRO_2024]: PlanCardFeatureDefinition | null;
        [PLANS.BUNDLE_BIZ_2025]: PlanCardFeatureDefinition | null;
        [PLANS.PASS_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.PASS_FAMILY]: PlanCardFeatureDefinition | null;
        [PLANS.PASS_BUSINESS]: PlanCardFeatureDefinition | null;
        [PLANS.VPN_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.VPN_BUSINESS]: PlanCardFeatureDefinition | null;
        [PLANS.LUMO]: PlanCardFeatureDefinition | null;
        [PLANS.LUMO_BUSINESS]: PlanCardFeatureDefinition | null;
        [PLANS.VISIONARY]: PlanCardFeatureDefinition | null;
        [PLANS.VPN_PASS_BUNDLE_BUSINESS]: PlanCardFeatureDefinition | null;
        [PLANS.MEET_BUSINESS]: PlanCardFeatureDefinition | null;
        [PLANS.MEET]: PlanCardFeatureDefinition | null;
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
    plan: PLANS;
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
