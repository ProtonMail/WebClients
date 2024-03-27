import { SUBSCRIPTION_STEPS } from './constants';

export const getInitialStep = (step?: SUBSCRIPTION_STEPS) => {
    switch (step) {
        case SUBSCRIPTION_STEPS.PLAN_SELECTION:
            return 'plan_selection';
        case SUBSCRIPTION_STEPS.CUSTOMIZATION:
            return 'customization';
        case SUBSCRIPTION_STEPS.CHECKOUT:
            return 'checkout';
        case SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION:
            return 'checkout_with_customization';
        default:
            return '';
    }
};
