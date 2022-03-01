import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

export interface PlanCardFeatureDefinition {
    featureName: string;
    tooltip: string;
    included: boolean;
    fire?: boolean;
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
        [PLANS.FAMILY]: PlanCardFeatureDefinition | null;
        [PLANS.MAIL_PRO]: PlanCardFeatureDefinition | null;
        [PLANS.BUNDLE_PRO]: PlanCardFeatureDefinition | null;
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
    plan: PLANS.FREE | PLANS.BUNDLE | PLANS.MAIL | PLANS.BUNDLE_PRO | PLANS.MAIL_PRO | PLANS.VPN;
    cta: string;
    features: PlanCardFeatureDefinition[];
}
