import { useMemo } from 'react';

import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AliasSync } from '@proton/pass/components/Onboarding/AliasSync';
import { BlackFriday2024Offer } from '@proton/pass/components/Onboarding/BlackFriday2024Offer';
import { UserRenewal } from '@proton/pass/components/Onboarding/UserRenewal';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { FiveStarIcon, ShieldIcon } from '@proton/pass/components/Spotlight/SpotlightIcon';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PASS_LEARN_MORE_URL, UpsellRef } from '@proton/pass/constants';
import { OnboardingMessage } from '@proton/pass/types';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const useOnboardingMessages = () => {
    const { onLink, openSettings, promptForPermissions, getRatingURL, onForceUpdate } = usePassCore();
    const { setPendingShareAccess, setUpselling } = useSpotlight();

    return useMemo<Partial<Record<OnboardingMessage, SpotlightMessageDefinition>>>(
        () => ({
            [OnboardingMessage.PENDING_SHARE_ACCESS]: {
                mode: 'default',
                id: 'welcome',
                hidden: true,
                title: c('Title').t`Pending access to the shared data`,
                message: c('Info').t`For security reasons, your access needs to be confirmed`,
                weak: true,
                onClose: () => setPendingShareAccess(false),
            },
            [OnboardingMessage.WELCOME]: {
                mode: 'default',
                id: 'welcome',
                title: c('Title').t`Why ${PASS_APP_NAME}?`,
                message: c('Info').t`Privacy is a big concern for us. Learn why ${PASS_APP_NAME} is different.`,
                className: 'ui-teal',
                icon: ShieldIcon,
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: () => onLink(PASS_LEARN_MORE_URL),
                },
            },
            [OnboardingMessage.TRIAL]: {
                mode: 'default',
                id: 'trial',
                title: c('Title').t`Our welcome gift to you`,
                message: c('Info')
                    .t`7 days to try premium features for free. Only during your first week of ${BRAND_NAME}.`,
                className: 'ui-orange',
                onClose: () => setUpselling(null),
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: () => setUpselling({ type: 'free-trial', upsellRef: UpsellRef.FREE_TRIAL }),
                },
            },
            [OnboardingMessage.SECURE_EXTENSION]: {
                mode: 'default',
                id: 'pin',
                title: c('Title').t`Secure your data`,
                message: c('Info').t`Enable auto-locking to secure your data`,
                className: 'ui-violet',
                icon: ShieldIcon,
                action: {
                    label: c('Label').t`Create lock`,
                    type: 'button',
                    onClick: () => openSettings?.('security'),
                },
            },
            [OnboardingMessage.UPDATE_AVAILABLE]: {
                mode: 'default',
                id: 'update',
                title: c('Title').t`Update available`,
                message: c('Info')
                    .t`A new version of ${PASS_APP_NAME} is available. Update it to enjoy the latest features and bug fixes.`,
                className: 'ui-orange',
                action: {
                    label: c('Label').t`Update`,
                    type: 'button',
                    onClick: onForceUpdate ?? noop,
                },
            },
            [OnboardingMessage.PERMISSIONS_REQUIRED]: {
                mode: 'default',
                id: 'permissions',
                title: c('Title').t`Grant permissions`,
                message: c('Info')
                    .t`In order to get the best experience out of ${PASS_APP_NAME}, please grant the necessary extension permissions`,
                className: 'ui-orange',
                action: {
                    label: c('Label').t`Grant`,
                    type: 'button',
                    onClick: () => promptForPermissions?.(),
                },
            },
            [OnboardingMessage.USER_RATING]: {
                mode: 'default',
                id: 'rating',
                title: c('Title').t`Enjoying ${PASS_APP_NAME}?`,
                message: c('Info').t`Please consider leaving a review.`,
                className: 'ui-lime',
                icon: FiveStarIcon,
                action: {
                    label: c('Label').t`Rate us`,
                    type: 'button',
                    onClick: getRatingURL ? () => onLink(getRatingURL()) : noop,
                },
            },
            [OnboardingMessage.STORAGE_ISSUE]: {
                mode: 'default',
                id: 'storage',
                title: c('Title').t`Low disk space`,
                message: c('Info')
                    .t`We are having trouble syncing data to your local storage. Please make sure you have sufficient disk space for ${PASS_SHORT_APP_NAME} to work smoothly.`,
                className: 'ui-red',
                action: {
                    label: c('Label').t`Need help?`,
                    type: 'button',
                    onClick: () => openSettings?.('support'),
                },
            },
            [OnboardingMessage.B2B_ONBOARDING]: {
                mode: 'default',
                id: 'b2b',
                title: c('Title').t`Get Started`,
                message: '',
                className: 'ui-teal hidden',
                icon: ShieldIcon,
            },
            [OnboardingMessage.EARLY_ACCESS]: {
                mode: 'default',
                id: 'early-access',
                hidden: true,
                title: c('Title').t`Upgrade to Unlock Premium Features`,
                message: c('Info').t`Please upgrade to have early access ${PASS_APP_NAME} web app`,
                weak: true,
                onClose: () => setUpselling(null),
            },
            [OnboardingMessage.ALIAS_SYNC_ENABLE]: {
                mode: 'custom',
                component: AliasSync,
                id: 'alias-sync',
                className: 'ui-teal',
            },
            [OnboardingMessage.BLACK_FRIDAY_2024]: {
                mode: 'custom',
                component: BlackFriday2024Offer,
                id: 'bf-2024',
                className: 'pass-bf2024-banner ui-violet',
            },
            [OnboardingMessage.USER_RENEWAL]: {
                mode: 'custom',
                component: UserRenewal,
                id: 'user-renewal',
                className: 'ui-red',
            },
        }),
        []
    );
};
