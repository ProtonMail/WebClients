import { c } from 'ttag';

import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience, PlansMap } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getStorageFeature = (
    bytes: number,
    options: { highlight?: boolean; boldStorageSize?: boolean; family?: boolean } = {}
): PlanCardFeatureDefinition => {
    const { highlight = false, boldStorageSize = false } = options;
    if (bytes === -1) {
        const freeStorageSize = humanSize(500 * 1024 ** 2, undefined, undefined, 0);
        const totalStorageSize = humanSize(1 * 1024 ** 3, undefined, undefined, 0);
        return {
            text: c('new_plans: feature').t`Up to ${totalStorageSize} storage`,
            tooltip: c('new_plans: tooltip')
                .t`Start with ${freeStorageSize} and unlock more storage along the way. Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`,
            included: true,
            icon: 'storage',
        };
    }

    const humanReadableSize = options.family
        ? c('specialoffer: Deal details').t`3 TB` // humanSize doesn't support TB and we don't want to add it yet because of "nice numbers" rounding issues.
        : humanSize(bytes, undefined, undefined, 0);

    const size = boldStorageSize ? <b key="bold-storage-size">{humanReadableSize}</b> : humanReadableSize;
    const tooltip = options.family
        ? c('new_plans: tooltip')
              .t`Storage space is shared between users across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}`
        : c('new_plans: tooltip')
              .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}`;

    return {
        text: c('new_plans: feature').jt`${size} storage`,
        tooltip,
        included: true,
        highlight,
        icon: 'storage',
    };
};

export const getStorageBoostFeature = (bundleStorage: string): PlanCardFeatureDefinition => {
    return {
        icon: 'storage',
        text: c('new_plans: Upsell attribute').t`Boost your storage space to ${bundleStorage} total`,
        included: true,
    };
};

export const getStorageBoostFeatureB2B = (bundleStorage: string): PlanCardFeatureDefinition => {
    return {
        icon: 'storage',
        text: c('new_plans: Upsell attribute').t`Boost your storage space to ${bundleStorage} per user`,
        included: true,
    };
};

export const getStorageFeatureB2B = (bytes: number, highlight?: boolean): PlanCardFeatureDefinition => {
    const size = humanSize(bytes, undefined, undefined, 0);
    return {
        text: c('new_plans: feature').t`${size} storage per user`,
        tooltip: c('new_plans: tooltip')
            .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}. Administrators can allocate different storage amounts to users in their organization`,
        included: true,
        highlight,
        icon: 'storage',
    };
};

const getEndToEndEncryption = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`End-to-end encryption`,
        included: true,
    };
};

export const getDriveAppFeature = (options?: { family?: boolean }): PlanCardFeatureDefinition => {
    return {
        text: DRIVE_APP_NAME,
        tooltip: options?.family
            ? c('new_plans: tooltip')
                  .t`Secure your files with encrypted cloud storage. Includes automatic sync, encrypted file sharing, and more.`
            : c('new_plans: tooltip').t`${DRIVE_APP_NAME}: end-to-end encrypted cloud storage`,
        included: true,
        icon: 'brand-proton-drive',
    };
};

const getShareFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Share files and folders via link`,
        tooltip: c('new_plans: tooltip').t`Share your files or folders with anyone by using secure, shareable links`,
        included: true,
    };
};

const getAdvancedShareFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Advanced sharing security`,
        tooltip: c('new_plans: tooltip')
            .t`Control access to your shared files by adding password protection and link expiration dates`,
        included: true,
    };
};

const getTeamManagement = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Team management`,
        included: false,
    };
};

const getDocumentEditor = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Document editors (docs, sheets, slides)`,
        included: false,
    };
};

export const getStorage = (plansMap: PlansMap): PlanCardFeature => {
    return {
        name: 'storage',
        plans: {
            [PLANS.FREE]: getStorageFeature(-1),
            [PLANS.BUNDLE]: getStorageFeature(plansMap[PLANS.BUNDLE]?.MaxSpace ?? 536870912000),
            [PLANS.MAIL]: getStorageFeature(plansMap[PLANS.MAIL]?.MaxSpace ?? 16106127360),
            [PLANS.VPN]: getStorageFeature(-1),
            [PLANS.DRIVE]: getStorageFeature(plansMap[PLANS.DRIVE]?.MaxSpace ?? 214748364800),
            [PLANS.PASS_PLUS]: getStorageFeature(-1),
            [PLANS.FAMILY]: getStorageFeature(plansMap[PLANS.FAMILY]?.MaxSpace ?? 2748779069440, {
                family: true,
            }),
            [PLANS.MAIL_PRO]: getStorageFeatureB2B(plansMap[PLANS.MAIL_PRO]?.MaxSpace ?? 16106127360),
            [PLANS.BUNDLE_PRO]: getStorageFeatureB2B(plansMap[PLANS.BUNDLE_PRO]?.MaxSpace ?? 536870912000),
            [PLANS.VPN_PRO]: null,
            [PLANS.VPN_BUSINESS]: null,
        },
    };
};

export const getDriveFeatures = (plansMap: PlansMap): PlanCardFeature[] => {
    return [
        getStorage(plansMap),
        {
            name: 'encryption',
            plans: {
                [PLANS.FREE]: getEndToEndEncryption(),
                [PLANS.BUNDLE]: getEndToEndEncryption(),
                [PLANS.MAIL]: getEndToEndEncryption(),
                [PLANS.VPN]: getEndToEndEncryption(),
                [PLANS.DRIVE]: getEndToEndEncryption(),
                [PLANS.PASS_PLUS]: getEndToEndEncryption(),
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'share',
            plans: {
                [PLANS.FREE]: getShareFeature(),
                [PLANS.BUNDLE]: getShareFeature(),
                [PLANS.MAIL]: getShareFeature(),
                [PLANS.VPN]: getShareFeature(),
                [PLANS.DRIVE]: getShareFeature(),
                [PLANS.PASS_PLUS]: getShareFeature(),
                [PLANS.FAMILY]: getShareFeature(),
                [PLANS.MAIL_PRO]: getShareFeature(),
                [PLANS.BUNDLE_PRO]: getShareFeature(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'advanced-share',
            plans: {
                [PLANS.FREE]: getAdvancedShareFeature(),
                [PLANS.BUNDLE]: getAdvancedShareFeature(),
                [PLANS.MAIL]: getAdvancedShareFeature(),
                [PLANS.VPN]: getAdvancedShareFeature(),
                [PLANS.DRIVE]: getAdvancedShareFeature(),
                [PLANS.PASS_PLUS]: getAdvancedShareFeature(),
                [PLANS.FAMILY]: getAdvancedShareFeature(),
                [PLANS.MAIL_PRO]: getAdvancedShareFeature(),
                [PLANS.BUNDLE_PRO]: getAdvancedShareFeature(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'team-management',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: getTeamManagement(),
                [PLANS.BUNDLE]: getTeamManagement(),
                [PLANS.MAIL]: getTeamManagement(),
                [PLANS.VPN]: getTeamManagement(),
                [PLANS.DRIVE]: getTeamManagement(),
                [PLANS.PASS_PLUS]: getTeamManagement(),
                [PLANS.FAMILY]: getTeamManagement(),
                [PLANS.MAIL_PRO]: getTeamManagement(),
                [PLANS.BUNDLE_PRO]: getTeamManagement(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'document-editor',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: getDocumentEditor(),
                [PLANS.BUNDLE]: getDocumentEditor(),
                [PLANS.MAIL]: getDocumentEditor(),
                [PLANS.VPN]: getDocumentEditor(),
                [PLANS.DRIVE]: getDocumentEditor(),
                [PLANS.PASS_PLUS]: getDocumentEditor(),
                [PLANS.FAMILY]: getDocumentEditor(),
                [PLANS.MAIL_PRO]: getDocumentEditor(),
                [PLANS.BUNDLE_PRO]: getDocumentEditor(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};
