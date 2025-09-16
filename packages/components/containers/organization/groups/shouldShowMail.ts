import { PLANS } from '@proton/payments';

const mailPlans = new Set([PLANS.MAIL_BUSINESS, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024, PLANS.VISIONARY]);

const shouldShowMail = (plan: PLANS | undefined) => {
    if (plan === undefined) {
        return true;
    }

    return mailPlans.has(plan);
};

export default shouldShowMail;
