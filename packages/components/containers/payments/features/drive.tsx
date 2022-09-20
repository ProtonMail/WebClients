import { c } from 'ttag';

import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience, PlansMap } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getStorageFeature = (
    bytes: number,
    options: { fire?: boolean; boldStorageSize?: boolean } = {}
): PlanCardFeatureDefinition => {
    const { fire = false, boldStorageSize = false } = options;
    if (bytes === -1) {
        const freeStorageSize = humanSize(500 * 1024 ** 2, undefined, undefined, 0);
        const totalStorageSize = humanSize(1 * 1024 ** 3, undefined, undefined, 0);
        return {
            featureName: c('new_plans: feature').t`Up to ${totalStorageSize} storage`,
            tooltip: c('new_plans: tooltip')
                .t`Start with ${freeStorageSize} and unlock more storage along the way. Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`,
            included: true,
            icon: 'storage',
        };
    }

    const humanReadableSize = humanSize(bytes, undefined, undefined, 0);
    const size = boldStorageSize ? <b key="bold-storage-size">{humanReadableSize}</b> : humanReadableSize;
    return {
        featureName: c('new_plans: feature').jt`${size} storage` as string,
        tooltip: c('new_plans: tooltip')
            .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}`,
        included: true,
        fire,
        icon: 'storage',
    };
};

export const getStorageFeatureB2B = (bytes: number, fire?: boolean): PlanCardFeatureDefinition => {
    const size = humanSize(bytes, undefined, undefined, 0);
    return {
        featureName: c('new_plans: feature').t`${size} storage per user`,
        tooltip: c('new_plans: tooltip')
            .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}. Administrators can allocate different storage amounts to users in their organization`,
        included: true,
        fire,
        icon: 'storage',
    };
};

const getEndToEndEncryption = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`End-to-end encryption`,
        tooltip: '',
        included: true,
    };
};

export const getDriveAppFeature = (): PlanCardFeatureDefinition => {
    return {
        featureName: DRIVE_APP_NAME,
        tooltip: c('new_plans: tooltip').t`End-to-end encrypted file storage`,
        included: true,
        icon: 'brand-proton-drive',
    };
};

const getShareFeature = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Share files and folders via link`,
        tooltip: c('new_plans: tooltip').t`Share your files or folders with anyone by using secure, shareable links`,
        included: true,
    };
};

const getAdvancedShareFeature = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Advanced sharing security`,
        tooltip: c('new_plans: tooltip')
            .t`Control access to your shared files by adding password protection and link expiration dates`,
        included: true,
    };
};

const getTeamManagement = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Team management`,
        tooltip: '',
        included: false,
    };
};

const getDocumentEditor = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Document editors (docs, sheets, slides)`,
        tooltip: '',
        included: false,
    };
};

export const getStorage = (plansMap: PlansMap): PlanCardFeature => {
    return {
        name: 'storage',
        plans: {
            [PLANS.FREE]: getStorageFeature(-1),
            [PLANS.BUNDLE]: getStorageFeature(plansMap[PLANS.BUNDLE]?.MaxSpace ?? 536870912000, { fire: true }),
            [PLANS.MAIL]: getStorageFeature(plansMap[PLANS.MAIL]?.MaxSpace ?? 16106127360),
            [PLANS.VPN]: getStorageFeature(-1),
            [PLANS.DRIVE]: getStorageFeature(plansMap[PLANS.DRIVE]?.MaxSpace ?? 214748364800),
            [PLANS.FAMILY]: getStorageFeature(plansMap[PLANS.FAMILY]?.MaxSpace ?? 2748779069440),
            [PLANS.MAIL_PRO]: getStorageFeatureB2B(plansMap[PLANS.MAIL_PRO]?.MaxSpace ?? 16106127360),
            [PLANS.BUNDLE_PRO]: getStorageFeatureB2B(plansMap[PLANS.BUNDLE_PRO]?.MaxSpace ?? 536870912000, true),
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
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
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
                [PLANS.FAMILY]: getShareFeature(),
                [PLANS.MAIL_PRO]: getShareFeature(),
                [PLANS.BUNDLE_PRO]: getShareFeature(),
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
                [PLANS.FAMILY]: getAdvancedShareFeature(),
                [PLANS.MAIL_PRO]: getAdvancedShareFeature(),
                [PLANS.BUNDLE_PRO]: getAdvancedShareFeature(),
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
                [PLANS.FAMILY]: getTeamManagement(),
                [PLANS.MAIL_PRO]: getTeamManagement(),
                [PLANS.BUNDLE_PRO]: getTeamManagement(),
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
                [PLANS.FAMILY]: getDocumentEditor(),
                [PLANS.MAIL_PRO]: getDocumentEditor(),
                [PLANS.BUNDLE_PRO]: getDocumentEditor(),
            },
        },
    ];
};
