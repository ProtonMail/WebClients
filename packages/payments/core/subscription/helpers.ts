import { ADDON_NAMES, PLANS } from '../constants';

export const getScribeAddonNameByPlan = (planName: PLANS) => {
    switch (planName) {
        case PLANS.MAIL_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO;
        case PLANS.BUNDLE_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO;
        case PLANS.BUNDLE_PRO_2024:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024;
        case PLANS.MAIL_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS;
    }
};
