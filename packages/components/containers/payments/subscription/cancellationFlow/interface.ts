import { type IconName } from '@proton/components/components/icon/Icon';
import type { PLANS } from '@proton/payments';

export interface PlanConfigReminder {
    title: string;
}

export interface PlanConfigTestimonial {
    title: string;
    description: string;
    learnMoreLink?: string;
    learnMoreCTA?: string;
    testimonials: {
        title: string;
        description: string;
        ctaText: string;
        link: string;
        picture: string;
    }[];
}

export interface PlanConfigFeatures {
    title: string;
    description: string;
    features: {
        icon: IconName;
        text: string;
    }[];
}

export interface PlanConfigStorage {
    title: string;
    description: string;
    warning: string | JSX.Element;
}

export interface ConfirmationModal {
    description: React.ReactNode;
    warningTitle: string;
    warningPoints: string[];
}

export interface PlanConfig {
    planName: string;
    plan: PLANS;
    reminder: PlanConfigReminder;
    testimonials: PlanConfigTestimonial;
    features: PlanConfigFeatures;
    storage?: PlanConfigStorage;
    confirmationModal: ConfirmationModal;
    upsellPlan?: PLANS;
}
