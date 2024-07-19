import { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';

export const getScribeAddonNameByPlan = (planName: PLANS) => {
    switch (planName) {
        case PLANS.MAIL:
            return ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS;
        case PLANS.DRIVE:
            return ADDON_NAMES.MEMBER_SCRIBE_DRIVEPLUS;
        case PLANS.BUNDLE:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE;
        case PLANS.PASS:
            return ADDON_NAMES.MEMBER_SCRIBE_PASS;
        case PLANS.VPN:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN;
        case PLANS.VPN2024:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN2024;
        case PLANS.VPN_PASS_BUNDLE:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN_PASS_BUNDLE;
        case PLANS.MAIL_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO;
        case PLANS.BUNDLE_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO;
        case PLANS.BUNDLE_PRO_2024:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024;
        case PLANS.MAIL_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS;
        case PLANS.PASS_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_PASS_PRO;
        case PLANS.VPN_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN_BIZ;
        case PLANS.PASS_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_PASS_BIZ;
        case PLANS.VPN_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN_PRO;
        case PLANS.FAMILY:
            return ADDON_NAMES.MEMBER_SCRIBE_FAMILY;
        case PLANS.DUO:
            return ADDON_NAMES.MEMBER_SCRIBE_DUO;
    }
};
