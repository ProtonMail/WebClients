import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { AliasSyncIcon, FiveStarIcon, ShieldIcon } from '@proton/pass/components/Spotlight/SpotlightIcon';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { BlackFriday2024Offer } from '@proton/pass/components/Upsell/BlackFriday2024Offer';
import { PASS_LEARN_MORE_URL, UpsellRef } from '@proton/pass/constants';
import { selectUser, selectUserData } from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const useOnboardingMessages = () => {
    const { onLink, openSettings, promptForPermissions, getRatingURL, onForceUpdate } = usePassCore();
    const { acknowledge, setPendingShareAccess, setUpselling } = useSpotlight();
    const user = useSelector(selectUser);

    const { pendingAliasToSync: aliasCount } = useSelector(selectUserData);

    return useMemo<Partial<Record<OnboardingMessage, SpotlightMessageDefinition>>>(
        () => ({
            [OnboardingMessage.PENDING_SHARE_ACCESS]: {
                type: 'default',
                id: 'welcome',
                hidden: true,
                title: c('Title').t`Pending access to the shared data`,
                message: c('Info').t`For security reasons, your access needs to be confirmed`,
                weak: true,
                onClose: () => acknowledge(OnboardingMessage.PENDING_SHARE_ACCESS, () => setPendingShareAccess(false)),
            },
            [OnboardingMessage.WELCOME]: {
                type: 'default',
                id: 'welcome',
                title: c('Title').t`Why ${PASS_APP_NAME}?`,
                message: c('Info').t`Privacy is a big concern for us. Learn why ${PASS_APP_NAME} is different.`,
                className: 'ui-teal',
                icon: ShieldIcon,
                onClose: () => acknowledge(OnboardingMessage.WELCOME),
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: () => acknowledge(OnboardingMessage.WELCOME, () => onLink(PASS_LEARN_MORE_URL)),
                },
            },
            [OnboardingMessage.TRIAL]: {
                type: 'default',
                id: 'trial',
                title: c('Title').t`Our welcome gift to you`,
                message: c('Info')
                    .t`7 days to try premium features for free. Only during your first week of ${BRAND_NAME}.`,
                className: 'ui-orange',
                onClose: () => acknowledge(OnboardingMessage.TRIAL, () => setUpselling(null)),
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: () =>
                        acknowledge(OnboardingMessage.TRIAL, () =>
                            setUpselling({
                                type: 'free-trial',
                                upsellRef: UpsellRef.FREE_TRIAL,
                            })
                        ),
                },
            },
            [OnboardingMessage.SECURE_EXTENSION]: {
                type: 'default',
                id: 'pin',
                title: c('Title').t`Secure your data`,
                message: c('Info').t`Enable auto-locking to secure your data`,
                className: 'ui-violet',
                icon: ShieldIcon,
                onClose: () => acknowledge(OnboardingMessage.SECURE_EXTENSION),
                action: {
                    label: c('Label').t`Create lock`,
                    type: 'button',
                    onClick: () => acknowledge(OnboardingMessage.SECURE_EXTENSION, () => openSettings?.('security')),
                },
            },
            [OnboardingMessage.UPDATE_AVAILABLE]: {
                type: 'default',
                id: 'update',
                title: c('Title').t`Update available`,
                message: c('Info')
                    .t`A new version of ${PASS_APP_NAME} is available. Update it to enjoy the latest features and bug fixes.`,
                className: 'ui-orange',
                onClose: () => acknowledge(OnboardingMessage.UPDATE_AVAILABLE),
                action: {
                    label: c('Label').t`Update`,
                    type: 'button',
                    onClick: () => acknowledge(OnboardingMessage.UPDATE_AVAILABLE, onForceUpdate ?? noop),
                },
            },
            [OnboardingMessage.PERMISSIONS_REQUIRED]: {
                type: 'default',
                id: 'permissions',
                title: c('Title').t`Grant permissions`,
                message: c('Info')
                    .t`In order to get the best experience out of ${PASS_APP_NAME}, please grant the necessary extension permissions`,
                className: 'ui-orange',
                onClose: () => acknowledge(OnboardingMessage.PERMISSIONS_REQUIRED),
                action: {
                    label: c('Label').t`Grant`,
                    type: 'button',
                    onClick: () => acknowledge(OnboardingMessage.PERMISSIONS_REQUIRED, () => promptForPermissions?.()),
                },
            },
            [OnboardingMessage.USER_RATING]: {
                type: 'default',
                id: 'rating',
                title: c('Title').t`Enjoying ${PASS_APP_NAME}?`,
                message: c('Info').t`Please consider leaving a review.`,
                className: 'ui-lime',
                icon: FiveStarIcon,
                onClose: () => acknowledge(OnboardingMessage.USER_RATING),
                action: {
                    label: c('Label').t`Rate us`,
                    type: 'button',
                    onClick: () =>
                        acknowledge(OnboardingMessage.USER_RATING, getRatingURL ? () => onLink(getRatingURL()) : noop),
                },
            },
            [OnboardingMessage.STORAGE_ISSUE]: {
                type: 'default',
                id: 'storage',
                title: c('Title').t`Low disk space`,
                message: c('Info')
                    .t`We are having trouble syncing data to your local storage. Please make sure you have sufficient disk space for ${PASS_SHORT_APP_NAME} to work smoothly.`,
                className: 'ui-red',
                onClose: () => acknowledge(OnboardingMessage.STORAGE_ISSUE),
                action: {
                    label: c('Label').t`Need help?`,
                    type: 'button',
                    onClick: () => acknowledge(OnboardingMessage.STORAGE_ISSUE, () => openSettings?.('support')),
                },
            },
            [OnboardingMessage.B2B_ONBOARDING]: {
                type: 'default',
                id: 'b2b',
                title: c('Title').t`Get Started`,
                message: '',
                className: 'ui-teal hidden',
                icon: ShieldIcon,
                onClose: () => acknowledge(OnboardingMessage.B2B_ONBOARDING),
            },
            [OnboardingMessage.EARLY_ACCESS]: {
                type: 'default',
                id: 'early-access',
                hidden: true,
                title: c('Title').t`Upgrade to Unlock Premium Features`,
                message: c('Info').t`Please upgrade to have early access ${PASS_APP_NAME} web app`,
                weak: true,
                onClose: () => acknowledge(OnboardingMessage.EARLY_ACCESS, () => setUpselling(null)),
            },
            [OnboardingMessage.ALIAS_SYNC_ENABLE]: {
                type: 'default',
                id: 'alias-sync',
                title: c('Title').t`Import your aliases from SimpleLogin`,
                message: c('Info').ngettext(
                    msgid`You have ${aliasCount} alias that is present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to import it?`,
                    `You have ${aliasCount} aliases that are present in SimpleLogin but missing in ${PASS_APP_NAME}. Would you like to import them?`,
                    aliasCount
                ),
                className: 'ui-teal',
                icon: AliasSyncIcon,
                onClose: () => acknowledge(OnboardingMessage.ALIAS_SYNC_ENABLE),
                action: {
                    label: c('Action').ngettext(msgid`Import alias`, `Import aliases`, aliasCount),
                    type: 'button',
                    onClick: () => acknowledge(OnboardingMessage.ALIAS_SYNC_ENABLE, () => openSettings?.('aliases')),
                },
            },
            [OnboardingMessage.BLACK_FRIDAY_2024]: {
                type: 'custom',
                component: BlackFriday2024Offer,
                id: 'bf-2024',
                className: 'pass-bf2024-banner ui-violet',
                onClose: () => acknowledge(OnboardingMessage.BLACK_FRIDAY_2024),
            },
        }),
        [user, aliasCount]
    );
};
