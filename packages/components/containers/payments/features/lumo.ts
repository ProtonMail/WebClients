import { c } from 'ttag';

import { PLANS } from '@proton/payments';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getUnlimitedChatsText = () => {
    return c('collider_2025: feature').t`Unlimited daily chats`;
};

const getDailyChats = (type: 'limited' | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text: type === 'limited' ? c('collider_2025: feature').t`Limited daily chats` : getUnlimitedChatsText(),
        included: true,
        icon: 'speech-bubble',
    };
};

const getWebSearchAccess = (): PlanCardFeatureDefinition => {
    return {
        text: c('collider_2025: feature').t`Web search access`,
        included: true,
        icon: 'magnifier',
    };
};

export const getFullChatHistoryText = () => {
    return c('collider_2025: feature').t`Full chat history with search`;
};

const getChatHistory = (type: 'basic' | 'full'): PlanCardFeatureDefinition => {
    return {
        text: type === 'basic' ? c('collider_2025: feature').t`Basic chat history` : getFullChatHistoryText(),
        included: true,
        icon: 'clock-rotate-left',
    };
};

const getFavourites = (type: 'limited' | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text:
            type === 'limited'
                ? c('collider_2025: feature').t`Limited favorites`
                : c('collider_2025: feature').t`Unlimited favorites for quick access`,
        included: true,
        icon: 'star',
    };
};

const getUploadAndQuery = (type: 'small' | 'large'): PlanCardFeatureDefinition => {
    return {
        text:
            type === 'small'
                ? c('collider_2025: feature').t`Upload and query small files`
                : c('collider_2025: feature').t`Upload and query multiple large files`,
        included: true,
        icon: 'arrow-up-line',
    };
};

export const getAccessToAdvancedAIText = () => {
    return c('collider_2025: feature').t`Access to advanced AI models`;
};

const getAccessToAdvancedAI = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: getAccessToAdvancedAIText(),
        included,
        icon: 'bolt',
    };
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
        {
            text: c('Subscription reminder').t`Priority support`,
            included: true,
            icon: 'life-ring',
        },
    ];

    return items;
};

export const getLumoFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'daily-chats',
            plans: {
                [PLANS.FREE]: getDailyChats('limited'),
                [PLANS.WALLET]: getDailyChats('limited'),
                [PLANS.BUNDLE]: getDailyChats('limited'),
                [PLANS.MAIL]: getDailyChats('limited'),
                [PLANS.VPN]: getDailyChats('limited'),
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
                [PLANS.PASS_PRO]: getDailyChats('limited'),
                [PLANS.PASS_BUSINESS]: getDailyChats('limited'),
                [PLANS.VPN_PRO]: getDailyChats('limited'),
                [PLANS.VPN_BUSINESS]: getDailyChats('limited'),
                [PLANS.LUMO]: getDailyChats('unlimited'),
                [PLANS.VISIONARY]: getDailyChats('unlimited'),
            },
        },
        {
            name: 'web-search-access',
            plans: {
                [PLANS.FREE]: getWebSearchAccess(),
                [PLANS.WALLET]: getWebSearchAccess(),
                [PLANS.BUNDLE]: getWebSearchAccess(),
                [PLANS.MAIL]: getWebSearchAccess(),
                [PLANS.VPN]: getWebSearchAccess(),
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
                [PLANS.PASS_PRO]: getWebSearchAccess(),
                [PLANS.PASS_BUSINESS]: getWebSearchAccess(),
                [PLANS.VPN_PRO]: getWebSearchAccess(),
                [PLANS.VPN_BUSINESS]: getWebSearchAccess(),
                [PLANS.LUMO]: getWebSearchAccess(),
                [PLANS.VISIONARY]: getWebSearchAccess(),
            },
        },
        {
            name: 'chat-history',
            plans: {
                [PLANS.FREE]: getChatHistory('basic'),
                [PLANS.WALLET]: getChatHistory('basic'),
                [PLANS.BUNDLE]: getChatHistory('basic'),
                [PLANS.MAIL]: getChatHistory('basic'),
                [PLANS.VPN]: getChatHistory('basic'),
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
                [PLANS.PASS_PRO]: getChatHistory('basic'),
                [PLANS.PASS_BUSINESS]: getChatHistory('basic'),
                [PLANS.VPN_PRO]: getChatHistory('basic'),
                [PLANS.VPN_BUSINESS]: getChatHistory('basic'),
                [PLANS.LUMO]: getChatHistory('full'),
                [PLANS.VISIONARY]: getChatHistory('full'),
            },
        },
        {
            name: 'favourites',
            plans: {
                [PLANS.FREE]: getFavourites('limited'),
                [PLANS.WALLET]: getFavourites('limited'),
                [PLANS.BUNDLE]: getFavourites('limited'),
                [PLANS.MAIL]: getFavourites('limited'),
                [PLANS.VPN]: getFavourites('limited'),
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
                [PLANS.PASS_PRO]: getFavourites('limited'),
                [PLANS.PASS_BUSINESS]: getFavourites('limited'),
                [PLANS.VPN_PRO]: getFavourites('limited'),
                [PLANS.VPN_BUSINESS]: getFavourites('limited'),
                [PLANS.LUMO]: getFavourites('unlimited'),
                [PLANS.VISIONARY]: getFavourites('unlimited'),
            },
        },
        {
            name: 'upload-and-query-files',
            plans: {
                [PLANS.FREE]: getUploadAndQuery('small'),
                [PLANS.WALLET]: getUploadAndQuery('small'),
                [PLANS.BUNDLE]: getUploadAndQuery('small'),
                [PLANS.MAIL]: getUploadAndQuery('small'),
                [PLANS.VPN]: getUploadAndQuery('small'),
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
                [PLANS.PASS_PRO]: getUploadAndQuery('small'),
                [PLANS.PASS_BUSINESS]: getUploadAndQuery('small'),
                [PLANS.VPN_PRO]: getUploadAndQuery('small'),
                [PLANS.VPN_BUSINESS]: getUploadAndQuery('small'),
                [PLANS.LUMO]: getUploadAndQuery('large'),
                [PLANS.VISIONARY]: getUploadAndQuery('large'),
            },
        },
        {
            name: 'access-to-advanced-ai',
            plans: {
                [PLANS.FREE]: getAccessToAdvancedAI(false),
                [PLANS.WALLET]: getAccessToAdvancedAI(false),
                [PLANS.BUNDLE]: getAccessToAdvancedAI(false),
                [PLANS.MAIL]: getAccessToAdvancedAI(false),
                [PLANS.VPN]: getAccessToAdvancedAI(false),
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
                [PLANS.PASS_PRO]: getAccessToAdvancedAI(false),
                [PLANS.PASS_BUSINESS]: getAccessToAdvancedAI(false),
                [PLANS.VPN_PRO]: getAccessToAdvancedAI(false),
                [PLANS.VPN_BUSINESS]: getAccessToAdvancedAI(false),
                [PLANS.LUMO]: getAccessToAdvancedAI(true),
                [PLANS.VISIONARY]: getAccessToAdvancedAI(true),
            },
        },
    ];
};
