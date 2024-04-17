import { IconName } from '@proton/components/components';
import { PLANS } from '@proton/shared/lib/constants';

export interface PlanConfigReminder {
    title: string;
    description: string;
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
    features: {
        icon: IconName;
        text: string;
    }[];
}

export interface PlanConfigStorage {
    title: string;
    warning: string | JSX.Element;
    quotaWarning: {
        title: string;
        description: { id: number; text: string | JSX.Element }[];
    }[];
}

export interface ConfirmationModal {
    description: string[];
    learnMoreLink: string;
}

export interface PlanConfig {
    plan: PLANS;
    reminder: PlanConfigReminder;
    testimonials: PlanConfigTestimonial;
    features: PlanConfigFeatures;
    storage: PlanConfigStorage;
    confirmationModal: ConfirmationModal;
    planCta: string;
    redirectModal: string;
}
