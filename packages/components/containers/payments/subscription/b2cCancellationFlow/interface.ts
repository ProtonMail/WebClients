import { IconName } from '@proton/components/components';
import { PLANS } from '@proton/shared/lib/constants';

export interface PlanConfigReminder {
    title: string;
}

export interface PlanConfigTestimonial {
    title: string;
    description: string;
    learMoreLink: string;
    learnMoreCTA: string;
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
    extraWarning?: string;
}

export interface PlanConfigStorage {
    title: string;
    description: string;
    warning: string | JSX.Element;
}

export interface ConfirmationModal {
    description: string[];
    warningTitle: string;
    warningPoints: string[];
}

export interface PlanConfig {
    plan: PLANS;
    reminder: PlanConfigReminder;
    testimonials: PlanConfigTestimonial;
    features: PlanConfigFeatures;
    storage?: PlanConfigStorage;
    confirmationModal: ConfirmationModal;
    keepPlanCTA: string;
    keepPlanCTAIcon: IconName;
    redirectModal: string;
}
