import { c } from 'ttag';

import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcBolt } from '@proton/icons/icons/IcBolt';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcImage } from '@proton/icons/icons/IcImage';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcMagicWand } from '@proton/icons/icons/IcMagicWand';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble';
import { IcStar } from '@proton/icons/icons/IcStar';
import { IcWindowTerminal } from '@proton/icons/icons/IcWindowTerminal';
import { PLANS } from '@proton/payments/core/constants';
import {
    LUMO_API_CREDIT_CURRENCY,
    LUMO_MONTHLY_API_CREDIT,
    type LumoApiPlan,
    type LumoMonthlyApiCredit,
} from '@proton/payments/core/plan/lumo-limits';
import { getSimplePriceString } from '@proton/payments/core/price-format';
import type { LumoTierPlan } from '@proton/payments/core/subscription/lumo-purchase-rules';
import { LUMO_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { PlanCardFeature, PlanCardFeatureDefinition, StandardPlanCardFeatureDefinition } from './interface';
import { getPrioritySupport } from './shared';

export const getLumoAppFeature = (): PlanCardFeatureDefinition => {
    return {
        id: 'lumo-app',
        text: LUMO_APP_NAME,
        included: true,
        // icon: 'brand-proton-lumo',
        tooltip: c('tooltip').t`${LUMO_APP_NAME}: AI assistant that respects your privacy`,
    };
};

export const getPrivateAIChatFeature = (): PlanCardFeatureDefinition => {
    return {
        id: 'private-ai-chat',
        text: c('new_plans: feature').t`Private AI Chat (${LUMO_APP_NAME})`,
        included: true,
    };
};

export const getUnlimitedChatsText = () => {
    return c('collider_2025: feature').t`Unlimited daily chats`;
};

export const getDailyChats = (type: 'limited' | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        id: 'daily-chats',
        text: type === 'limited' ? c('collider_2025: feature').t`Limited daily chats` : getUnlimitedChatsText(),
        included: true,
        icon: IcSpeechBubble,
    };
};

export const getWebSearchAccess = (): PlanCardFeatureDefinition => {
    return {
        id: 'web-search-access',
        text: c('collider_2025: feature').t`Web search access`,
        included: true,
        icon: IcMagnifier,
    };
};

export const getFullChatHistoryText = () => {
    return c('collider_2025: feature').t`Full chat history with search`;
};

export const getChatHistory = (type: 'basic' | 'full'): PlanCardFeatureDefinition => {
    return {
        id: 'chat-history',
        text: type === 'basic' ? c('collider_2025: feature').t`Basic chat history` : getFullChatHistoryText(),
        included: true,
        icon: IcClockRotateLeft,
    };
};

export const getFavourites = (type: 'limited' | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        id: 'favourites',
        text:
            type === 'limited'
                ? c('collider_2025: feature').t`Limited favorites`
                : c('collider_2025: feature').t`Unlimited favorites for quick access`,
        included: true,
        icon: IcStar,
    };
};

export const getUploadAndQuery = (type: 'small' | 'large'): PlanCardFeatureDefinition => {
    return {
        id: 'upload-and-query',
        text:
            type === 'small'
                ? c('collider_2025: feature').t`Upload and query small files`
                : c('collider_2025: feature').t`Upload and query multiple large files`,
        included: true,
        icon: IcArrowUpLine,
    };
};

export const getAccessToAdvancedAIText = () => {
    return c('collider_2025: feature').t`Access to advanced AI models`;
};

export const getAccessToAdvancedAI = (included: boolean): PlanCardFeatureDefinition => {
    return {
        id: 'access-to-advanced-ai',
        text: getAccessToAdvancedAIText(),
        included,
        icon: IcBolt,
    };
};

export const getNeverUsedForTraining = (): PlanCardFeatureDefinition => {
    return {
        id: 'never-used-for-training',
        text: c('collider_2025: feature').t`Data never used for AI training`,
        included: true,
        icon: IcAlias,
    };
};

export const getZeroAccessEncryption = (): PlanCardFeatureDefinition => {
    return {
        id: 'zero-access-encryption',
        text: c('collider_2025: feature').t`Zero-access encryption`,
        included: true,
        icon: IcLock,
    };
};

export const getDataProtectionCompliance = (): PlanCardFeatureDefinition => {
    return {
        id: 'data-protection-compliance',
        text: c('collider_2025: feature').t`Compliance with data protection regulations`,
        included: true,
        icon: IcShield,
    };
};

export const getNoLogsPolicy = (): PlanCardFeatureDefinition => {
    return {
        id: 'no-logs-policy',
        text: c('collider_2025: feature').t`Strict no-logs policy`,
        included: true,
        icon: IcEyeSlash,
    };
};

const getLumo2026Feature = (
    id: string,
    text: string,
    icon: StandardPlanCardFeatureDefinition['icon']
): StandardPlanCardFeatureDefinition => {
    return { id, text, included: true, icon };
};

const getLumoCode = (): StandardPlanCardFeatureDefinition => {
    return getLumo2026Feature('lumo-code', c('lumo_2026: feature').t`${LUMO_SHORT_APP_NAME} Code`, IcCode);
};

const getApiAccessText = ({ amountInCents, perUser }: LumoMonthlyApiCredit) => {
    const credit = getSimplePriceString(LUMO_API_CREDIT_CURRENCY, amountInCents);

    if (perUser) {
        // translator: the plan includes Lumo API access and money each user of the organization can spend on it every month. Full sentence: "API access, with US$5 a month credit per user"
        return c('lumo_2026: feature').t`API access, with ${credit} a month credit per user`;
    }

    // translator: the plan includes Lumo API access and money the user can spend on it every month. Full sentence: "API access, with US$50 a month credit"
    return c('lumo_2026: feature').t`API access, with ${credit} a month credit`;
};

export const getLumoApiAccess = (plan: LumoApiPlan): StandardPlanCardFeatureDefinition => {
    return getLumo2026Feature('lumo-api-access', getApiAccessText(LUMO_MONTHLY_API_CREDIT[plan]), IcWindowTerminal);
};

export const getLumoFree2026Features = (): StandardPlanCardFeatureDefinition[] => {
    return [
        getLumo2026Feature(
            'lumo-limited-messages-chat-history',
            c('lumo_2026: feature').t`Limited messages and chat history`,
            IcSpeechBubble
        ),
        getLumo2026Feature(
            'lumo-limited-skills-projects-tasks',
            c('lumo_2026: feature').t`Limited Skills, Projects, and scheduled tasks`,
            IcMagicWand
        ),
        getLumo2026Feature(
            'lumo-limited-image-generation',
            c('lumo_2026: feature').t`Limited image generation`,
            IcImage
        ),
    ];
};

export const getLumoFree2026FeaturesIntro = () => {
    // translator: heading above the list of what the free Lumo plan includes
    return c('lumo_2026: feature').t`Includes:`;
};

const getMoreUsage = () => {
    return getLumo2026Feature('lumo-more-usage', c('lumo_2026: feature').t`More usage`, IcSpeechBubble);
};

const getTwiceBasicUsage = () => {
    return getLumo2026Feature(
        'lumo-twice-basic-usage',
        // translator: "Basic" is the Lumo Basic plan. Lumo Plus allows twice as many messages as Lumo Basic
        c('lumo_2026: feature').t`2x Basic usage`,
        IcBolt
    );
};

const getFiveTimesPlusUsage = () => {
    return getLumo2026Feature(
        'lumo-five-times-plus-usage',
        // translator: "Plus" is the Lumo Plus plan. Lumo Ultra allows five times as many messages as Lumo Plus
        c('lumo_2026: feature').t`5x Plus usage`,
        IcBolt
    );
};

const getMoreImageGeneration = () => {
    return getLumo2026Feature('lumo-more-image-generation', c('lumo_2026: feature').t`More image generation`, IcImage);
};

const getExtendedImageGeneration = () => {
    return getLumo2026Feature(
        'lumo-extended-image-generation',
        c('lumo_2026: feature').t`Extended image generation`,
        IcImage
    );
};

const getMaximumImageGeneration = () => {
    return getLumo2026Feature(
        'lumo-maximum-image-generation',
        c('lumo_2026: feature').t`Maximum image generation`,
        IcImage
    );
};

const getMoreSkillsProjectsTasks = () => {
    return getLumo2026Feature(
        'lumo-more-skills-projects-tasks',
        c('lumo_2026: feature').t`More Skills, Projects, and scheduled tasks`,
        IcMagicWand
    );
};

const getMaximumSkillsProjects = () => {
    return getLumo2026Feature(
        'lumo-maximum-skills-projects',
        c('lumo_2026: feature').t`Maximum Skills and Projects`,
        IcMagicWand
    );
};

const LUMO_TIER_ADDED_FEATURES: Record<LumoTierPlan, () => StandardPlanCardFeatureDefinition[]> = {
    [PLANS.LUMO_BASIC]: () => [getMoreUsage(), getMoreImageGeneration(), getMoreSkillsProjectsTasks(), getLumoCode()],
    [PLANS.LUMO]: () => [getTwiceBasicUsage(), getExtendedImageGeneration(), getMaximumSkillsProjects()],
    [PLANS.LUMO_ULTRA]: () => [
        getFiveTimesPlusUsage(),
        getMaximumImageGeneration(),
        getLumoApiAccess(PLANS.LUMO_ULTRA),
    ],
};

export const getLumoTierFeatures = (plan: LumoTierPlan): StandardPlanCardFeatureDefinition[] => {
    return LUMO_TIER_ADDED_FEATURES[plan]();
};

const LUMO_TIER_ALL_FEATURES: Record<LumoTierPlan, () => StandardPlanCardFeatureDefinition[]> = {
    [PLANS.LUMO_BASIC]: () => [getMoreUsage(), getMoreImageGeneration(), getMoreSkillsProjectsTasks(), getLumoCode()],
    [PLANS.LUMO]: () => [getTwiceBasicUsage(), getExtendedImageGeneration(), getMaximumSkillsProjects(), getLumoCode()],
    [PLANS.LUMO_ULTRA]: () => [
        getFiveTimesPlusUsage(),
        getMaximumImageGeneration(),
        getMaximumSkillsProjects(),
        getLumoCode(),
        getLumoApiAccess(PLANS.LUMO_ULTRA),
    ],
};

export const getLumoTierAllFeatures = (plan: LumoTierPlan): StandardPlanCardFeatureDefinition[] => {
    return LUMO_TIER_ALL_FEATURES[plan]();
};

const LUMO_TIER_FEATURES_INTRO: Record<LumoTierPlan, () => string> = {
    // translator: heading above the list of what Lumo Basic adds to the free plan
    [PLANS.LUMO_BASIC]: () => c('lumo_2026: feature').t`Everything in Free, and:`,
    // translator: heading above the list of what Lumo Plus adds to Lumo Basic
    [PLANS.LUMO]: () => c('lumo_2026: feature').t`Everything in Basic, and:`,
    // translator: heading above the list of what Lumo Ultra adds to Lumo Plus
    [PLANS.LUMO_ULTRA]: () => c('lumo_2026: feature').t`Everything in Plus, and:`,
};

export const getLumoTierFeaturesIntro = (plan: LumoTierPlan): string => {
    return LUMO_TIER_FEATURES_INTRO[plan]();
};

export const getLumoFreeFeatures = () => {
    const items: PlanCardFeatureDefinition[] = [
        getDailyChats('limited'),
        getWebSearchAccess(),
        getChatHistory('basic'),
        getFavourites('limited'),
        getUploadAndQuery('small'),
    ];

    return items;
};

export const getLumoPlusFeatures = () => {
    const items: PlanCardFeatureDefinition[] = [
        getDailyChats('unlimited'),
        getWebSearchAccess(),
        getChatHistory('full'),
        getFavourites('unlimited'),
        getUploadAndQuery('large'),
        getAccessToAdvancedAI(true),
        getPrioritySupport(),
    ];

    return items;
};

export const getLumoProfessionalFeatures = () => {
    return [
        getZeroAccessEncryption(),
        getDailyChats('unlimited'),
        getWebSearchAccess(),
        getChatHistory('full'),
        getUploadAndQuery('large'),
        getAccessToAdvancedAI(true),
        getNeverUsedForTraining(),
        getDataProtectionCompliance(),
    ];
};

export const getLumoProfessional2026Features = (): PlanCardFeatureDefinition[] => {
    return [...getLumoProfessionalFeatures(), getLumoApiAccess(PLANS.LUMO_BUSINESS)];
};

export const getLumoFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'daily-chats',
            plans: {
                [PLANS.FREE]: getDailyChats('limited'),
                [PLANS.BUNDLE]: getDailyChats('limited'),
                [PLANS.MAIL]: getDailyChats('limited'),
                [PLANS.VPN2024]: getDailyChats('limited'),
                [PLANS.DRIVE]: getDailyChats('limited'),
                [PLANS.DRIVE_1TB]: getDailyChats('limited'),
                [PLANS.DRIVE_BUSINESS]: getDailyChats('limited'),
                [PLANS.PASS]: getDailyChats('limited'),
                [PLANS.PASS_LIFETIME]: getDailyChats('limited'),
                [PLANS.PASS_FAMILY]: getDailyChats('limited'),
                [PLANS.FAMILY]: getDailyChats('limited'),
                [PLANS.DUO]: getDailyChats('limited'),
                [PLANS.MAIL_PRO]: getDailyChats('limited'),
                [PLANS.MAIL_BUSINESS]: getDailyChats('limited'),
                [PLANS.BUNDLE_PRO]: getDailyChats('limited'),
                [PLANS.BUNDLE_PRO_2024]: getDailyChats('limited'),
                [PLANS.BUNDLE_BIZ_2025]: getDailyChats('unlimited'),
                [PLANS.PASS_PRO]: getDailyChats('limited'),
                [PLANS.PASS_BUSINESS]: getDailyChats('limited'),
                [PLANS.VPN_PRO]: getDailyChats('limited'),
                [PLANS.VPN_BUSINESS]: getDailyChats('limited'),
                [PLANS.LUMO]: getDailyChats('unlimited'),
                [PLANS.LUMO_BUSINESS]: getDailyChats('unlimited'),
                [PLANS.MEET_BUSINESS]: getDailyChats('limited'),
                [PLANS.MEET]: getDailyChats('limited'),
                [PLANS.VISIONARY]: getDailyChats('unlimited'),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getDailyChats('limited'),
            },
        },
        {
            name: 'web-search-access',
            plans: {
                [PLANS.FREE]: getWebSearchAccess(),
                [PLANS.BUNDLE]: getWebSearchAccess(),
                [PLANS.MAIL]: getWebSearchAccess(),
                [PLANS.VPN2024]: getWebSearchAccess(),
                [PLANS.DRIVE]: getWebSearchAccess(),
                [PLANS.DRIVE_1TB]: getWebSearchAccess(),
                [PLANS.DRIVE_BUSINESS]: getWebSearchAccess(),
                [PLANS.PASS]: getWebSearchAccess(),
                [PLANS.PASS_LIFETIME]: getWebSearchAccess(),
                [PLANS.PASS_FAMILY]: getWebSearchAccess(),
                [PLANS.FAMILY]: getWebSearchAccess(),
                [PLANS.DUO]: getWebSearchAccess(),
                [PLANS.MAIL_PRO]: getWebSearchAccess(),
                [PLANS.MAIL_BUSINESS]: getWebSearchAccess(),
                [PLANS.BUNDLE_PRO]: getWebSearchAccess(),
                [PLANS.BUNDLE_PRO_2024]: getWebSearchAccess(),
                [PLANS.BUNDLE_BIZ_2025]: getWebSearchAccess(),
                [PLANS.PASS_PRO]: getWebSearchAccess(),
                [PLANS.PASS_BUSINESS]: getWebSearchAccess(),
                [PLANS.VPN_PRO]: getWebSearchAccess(),
                [PLANS.VPN_BUSINESS]: getWebSearchAccess(),
                [PLANS.LUMO]: getWebSearchAccess(),
                [PLANS.LUMO_BUSINESS]: getWebSearchAccess(),
                [PLANS.MEET_BUSINESS]: getWebSearchAccess(),
                [PLANS.MEET]: getWebSearchAccess(),
                [PLANS.VISIONARY]: getWebSearchAccess(),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getWebSearchAccess(),
            },
        },
        {
            name: 'chat-history',
            plans: {
                [PLANS.FREE]: getChatHistory('basic'),
                [PLANS.BUNDLE]: getChatHistory('basic'),
                [PLANS.MAIL]: getChatHistory('basic'),
                [PLANS.VPN2024]: getChatHistory('basic'),
                [PLANS.DRIVE]: getChatHistory('basic'),
                [PLANS.DRIVE_1TB]: getChatHistory('basic'),
                [PLANS.DRIVE_BUSINESS]: getChatHistory('basic'),
                [PLANS.PASS]: getChatHistory('basic'),
                [PLANS.PASS_LIFETIME]: getChatHistory('basic'),
                [PLANS.PASS_FAMILY]: getChatHistory('basic'),
                [PLANS.FAMILY]: getChatHistory('basic'),
                [PLANS.DUO]: getChatHistory('basic'), // TODO validate with product
                [PLANS.MAIL_PRO]: getChatHistory('basic'),
                [PLANS.MAIL_BUSINESS]: getChatHistory('basic'),
                [PLANS.BUNDLE_PRO]: getChatHistory('basic'),
                [PLANS.BUNDLE_PRO_2024]: getChatHistory('basic'),
                [PLANS.BUNDLE_BIZ_2025]: getChatHistory('full'),
                [PLANS.PASS_PRO]: getChatHistory('basic'),
                [PLANS.PASS_BUSINESS]: getChatHistory('basic'),
                [PLANS.VPN_PRO]: getChatHistory('basic'),
                [PLANS.VPN_BUSINESS]: getChatHistory('basic'),
                [PLANS.LUMO]: getChatHistory('full'),
                [PLANS.LUMO_BUSINESS]: getChatHistory('full'),
                [PLANS.MEET_BUSINESS]: getChatHistory('basic'),
                [PLANS.MEET]: getChatHistory('basic'),
                [PLANS.VISIONARY]: getChatHistory('full'),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getChatHistory('basic'),
            },
        },
        {
            name: 'favourites',
            plans: {
                [PLANS.FREE]: getFavourites('limited'),
                [PLANS.BUNDLE]: getFavourites('limited'),
                [PLANS.MAIL]: getFavourites('limited'),
                [PLANS.VPN2024]: getFavourites('limited'),
                [PLANS.DRIVE]: getFavourites('limited'),
                [PLANS.DRIVE_1TB]: getFavourites('limited'),
                [PLANS.DRIVE_BUSINESS]: getFavourites('limited'),
                [PLANS.PASS]: getFavourites('limited'),
                [PLANS.PASS_LIFETIME]: getFavourites('limited'),
                [PLANS.PASS_FAMILY]: getFavourites('limited'),
                [PLANS.FAMILY]: getFavourites('limited'),
                [PLANS.DUO]: getFavourites('limited'),
                [PLANS.MAIL_PRO]: getFavourites('limited'),
                [PLANS.MAIL_BUSINESS]: getFavourites('limited'),
                [PLANS.BUNDLE_PRO]: getFavourites('limited'),
                [PLANS.BUNDLE_PRO_2024]: getFavourites('limited'),
                [PLANS.BUNDLE_BIZ_2025]: getFavourites('unlimited'),
                [PLANS.PASS_PRO]: getFavourites('limited'),
                [PLANS.PASS_BUSINESS]: getFavourites('limited'),
                [PLANS.VPN_PRO]: getFavourites('limited'),
                [PLANS.VPN_BUSINESS]: getFavourites('limited'),
                [PLANS.LUMO]: getFavourites('unlimited'),
                [PLANS.LUMO_BUSINESS]: getFavourites('unlimited'),
                [PLANS.MEET_BUSINESS]: getFavourites('limited'),
                [PLANS.MEET]: getFavourites('limited'),
                [PLANS.VISIONARY]: getFavourites('unlimited'),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getFavourites('limited'),
            },
        },
        {
            name: 'upload-and-query-files',
            plans: {
                [PLANS.FREE]: getUploadAndQuery('small'),
                [PLANS.BUNDLE]: getUploadAndQuery('small'),
                [PLANS.MAIL]: getUploadAndQuery('small'),
                [PLANS.VPN2024]: getUploadAndQuery('small'),
                [PLANS.DRIVE]: getUploadAndQuery('small'),
                [PLANS.DRIVE_1TB]: getUploadAndQuery('small'),
                [PLANS.DRIVE_BUSINESS]: getUploadAndQuery('small'),
                [PLANS.PASS]: getUploadAndQuery('small'),
                [PLANS.PASS_LIFETIME]: getUploadAndQuery('small'),
                [PLANS.PASS_FAMILY]: getUploadAndQuery('small'),
                [PLANS.FAMILY]: getUploadAndQuery('small'),
                [PLANS.DUO]: getUploadAndQuery('small'),
                [PLANS.MAIL_PRO]: getUploadAndQuery('small'),
                [PLANS.MAIL_BUSINESS]: getUploadAndQuery('small'),
                [PLANS.BUNDLE_PRO]: getUploadAndQuery('small'),
                [PLANS.BUNDLE_PRO_2024]: getUploadAndQuery('small'),
                [PLANS.BUNDLE_BIZ_2025]: getUploadAndQuery('large'),
                [PLANS.PASS_PRO]: getUploadAndQuery('small'),
                [PLANS.PASS_BUSINESS]: getUploadAndQuery('small'),
                [PLANS.VPN_PRO]: getUploadAndQuery('small'),
                [PLANS.VPN_BUSINESS]: getUploadAndQuery('small'),
                [PLANS.LUMO]: getUploadAndQuery('large'),
                [PLANS.LUMO_BUSINESS]: getUploadAndQuery('large'),
                [PLANS.MEET_BUSINESS]: getUploadAndQuery('small'),
                [PLANS.MEET]: getUploadAndQuery('small'),
                [PLANS.VISIONARY]: getUploadAndQuery('large'),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getUploadAndQuery('small'),
            },
        },
        {
            name: 'access-to-advanced-ai',
            plans: {
                [PLANS.FREE]: getAccessToAdvancedAI(false),
                [PLANS.BUNDLE]: getAccessToAdvancedAI(false),
                [PLANS.MAIL]: getAccessToAdvancedAI(false),
                [PLANS.VPN2024]: getAccessToAdvancedAI(false),
                [PLANS.DRIVE]: getAccessToAdvancedAI(false),
                [PLANS.DRIVE_1TB]: getAccessToAdvancedAI(false),
                [PLANS.DRIVE_BUSINESS]: getAccessToAdvancedAI(false),
                [PLANS.PASS]: getAccessToAdvancedAI(false),
                [PLANS.PASS_LIFETIME]: getAccessToAdvancedAI(false),
                [PLANS.PASS_FAMILY]: getAccessToAdvancedAI(false),
                [PLANS.FAMILY]: getAccessToAdvancedAI(false),
                [PLANS.DUO]: getAccessToAdvancedAI(false),
                [PLANS.MAIL_PRO]: getAccessToAdvancedAI(false),
                [PLANS.MAIL_BUSINESS]: getAccessToAdvancedAI(false),
                [PLANS.BUNDLE_PRO]: getAccessToAdvancedAI(false),
                [PLANS.BUNDLE_PRO_2024]: getAccessToAdvancedAI(false),
                [PLANS.BUNDLE_BIZ_2025]: getAccessToAdvancedAI(true),
                [PLANS.PASS_PRO]: getAccessToAdvancedAI(false),
                [PLANS.PASS_BUSINESS]: getAccessToAdvancedAI(false),
                [PLANS.VPN_PRO]: getAccessToAdvancedAI(false),
                [PLANS.VPN_BUSINESS]: getAccessToAdvancedAI(false),
                [PLANS.LUMO]: getAccessToAdvancedAI(true),
                [PLANS.LUMO_BUSINESS]: getAccessToAdvancedAI(true),
                [PLANS.MEET_BUSINESS]: getAccessToAdvancedAI(false),
                [PLANS.MEET]: getAccessToAdvancedAI(false),
                [PLANS.VISIONARY]: getAccessToAdvancedAI(true),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getAccessToAdvancedAI(false),
            },
        },
    ];
};
