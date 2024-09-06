import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { FiveStarIcon, ShieldIcon } from '@proton/pass/components/Spotlight/SpotlightIcon';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PASS_BF_MONTHLY_PRICE, PASS_LEARN_MORE_URL, UpsellRef } from '@proton/pass/constants';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { selectUser } from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import { BRAND_NAME, DEFAULT_CURRENCY, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const useOnboardingMessages = () => {
    const { onLink, openSettings, promptForPermissions, getRatingURL, onForceUpdate } = usePassCore();
    const { acknowledge, setPendingShareAccess, setUpselling } = useSpotlight();

    const { SSO_URL } = usePassConfig();
    const user = useSelector(selectUser);

    return useMemo<Partial<Record<OnboardingMessage, SpotlightMessageDefinition>>>(
        () => ({
            [OnboardingMessage.PENDING_SHARE_ACCESS]: {
                id: 'welcome',
                hidden: true,
                title: c('Title').t`Pending access to the shared data`,
                message: c('Info').t`For security reasons, your access needs to be confirmed`,
                weak: true,
                onClose: () => acknowledge(OnboardingMessage.PENDING_SHARE_ACCESS, () => setPendingShareAccess(false)),
            },
            [OnboardingMessage.WELCOME]: {
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
                id: 'storage',
                title: c('Title').t`Low disk space`,
                message: c('Info')
                    .t`We are having trouble syncing data to your local storage. Please make sure you have sufficient disk space for ${PASS_SHORT_APP_NAME} to work smoothly.`,
                className: 'ui-red',
                onClose: () => acknowledge(OnboardingMessage.STORAGE_ISSUE),
                action: {
                    label: c('Label').t`Need help ?`,
                    type: 'button',
                    onClick: () => acknowledge(OnboardingMessage.STORAGE_ISSUE, () => openSettings?.('support')),
                },
            },
            [OnboardingMessage.BLACK_FRIDAY_OFFER]: {
                id: 'black-friday',
                title: c('bf2023: Title').t`Black Friday offer`,
                message: (() => {
                    const relativePrice = getSimplePriceString(
                        user?.Currency ?? DEFAULT_CURRENCY,
                        PASS_BF_MONTHLY_PRICE
                    );
                    return c('bf2023: Info')
                        .t`Save Smart. Get a year of Pass Plus for only ${relativePrice} per month.`;
                })(),
                className: 'ui-orange',
                onClose: () => acknowledge(OnboardingMessage.BLACK_FRIDAY_OFFER),
                action: {
                    label: c('bf2023: Label').t`Get the deal`,
                    type: 'button',
                    onClick: () =>
                        acknowledge(OnboardingMessage.BLACK_FRIDAY_OFFER, () =>
                            onLink(`${SSO_URL}/pass/dashboard?plan=pass2023&coupon=BF2023&cycle=12`)
                        ),
                },
            },
            [OnboardingMessage.B2B_ONBOARDING]: {
                id: 'b2b',
                title: c('Title').t`Get Started`,
                message: '',
                className: 'ui-teal hidden',
                icon: ShieldIcon,
                onClose: () => acknowledge(OnboardingMessage.B2B_ONBOARDING),
            },
            [OnboardingMessage.EARLY_ACCESS]: {
                id: 'early-access',
                hidden: true,
                title: c('Title').t`Upgrade to Unlock Premium Features`,
                message: c('Info').t`Please upgrade to have early access ${PASS_APP_NAME} web app`,
                weak: true,
                onClose: () => acknowledge(OnboardingMessage.EARLY_ACCESS, () => setUpselling(null)),
            },
        }),
        [user]
    );
};
