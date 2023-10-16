import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlightContext } from '@proton/pass/components/Spotlight/SpotlightContext';
import { FiveStarIcon, InviteIcon, ShieldIcon } from '@proton/pass/components/Spotlight/SpotlightIcon';
import { PASS_BF_MONTHLY_PRICE } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { detectBrowser, getWebStoreUrl } from '@proton/pass/lib/extension/utils/browser';
import browser from '@proton/pass/lib/globals/browser';
import { selectUser } from '@proton/pass/store/selectors';
import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import type { Callback, MaybeNull, WorkerMessageWithSender } from '@proton/pass/types';
import { OnboardingMessage, WorkerMessageType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { promptForPermissions } from '../utils/permissions';
import { useExtensionConnectContext } from './useExtensionConnectContext';
import { useOpenSettingsTab } from './useOpenSettingsTab';

export const useSpotlightEffect = () => {
    const { context: extensionContext } = useExtensionConnectContext();
    const invite = useInviteContext();
    const spotlight = useSpotlightContext();
    const webStoreURL = getWebStoreUrl(detectBrowser());
    const { SSO_URL } = usePassConfig();

    const sharingEnabled = useFeatureFlag(PassFeature.PassSharingV1);
    const latestInvite = useSelector(selectMostRecentInvite);
    const [message, setMessage] = useState<MaybeNull<OnboardingMessage>>(null);
    const user = useSelector(selectUser);

    const openSettings = useOpenSettingsTab();

    useEffect(() => {
        /* If the latest invite was promoted from a new user invite,
         * auto prompt the "respond to invite" modal */
        if (latestInvite?.fromNewUser) invite.respondToInvite(latestInvite);
    }, [latestInvite]);

    const inviteMessage = useMemo<MaybeNull<SpotlightMessageDefinition>>(
        () =>
            sharingEnabled && latestInvite && !latestInvite.fromNewUser
                ? {
                      id: latestInvite.token,
                      weak: true,
                      dense: false,
                      title: c('Title').t`Vault shared with you`,
                      message: c('Info').t`You're invited to a vault.`,
                      icon: InviteIcon,
                      action: {
                          label: c('Label').t`View details`,
                          type: 'button',
                          onClick: () => invite.respondToInvite(latestInvite),
                      },
                  }
                : null,
        [latestInvite]
    );

    const withAcknowledgment = useCallback(
        (cb: Callback = noop) =>
            () => {
                if (message) {
                    void sendMessage(
                        popupMessage({
                            type: WorkerMessageType.ONBOARDING_ACK,
                            payload: { message },
                        })
                    );
                }

                cb();
                setMessage(null);
            },
        [message]
    );

    const definitions = useMemo<{ [K in OnboardingMessage]: SpotlightMessageDefinition }>(
        () => ({
            [OnboardingMessage.PENDING_SHARE_ACCESS]: {
                id: 'welcome',
                title: c('Title').t`Pending access to the shared data`,
                message: c('Info').t`For security reasons, your access needs to be confirmed`,
                weak: true,
                onClose: withAcknowledgment(() => spotlight.setPendingShareAccess(false)),
            },
            [OnboardingMessage.WELCOME]: {
                id: 'welcome',
                title: c('Title').t`Why ${PASS_APP_NAME}?`,
                message: c('Info').t`Privacy is a big concern for us. Learn why ${PASS_APP_NAME} is different.`,
                className: 'ui-teal',
                icon: ShieldIcon,
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: withAcknowledgment(() => browser.tabs.create({ url: 'https://proton.me/pass' })),
                },
            },
            [OnboardingMessage.TRIAL]: {
                id: 'trial',
                title: c('Title').t`Our welcome gift to you`,
                message: c('Info')
                    .t`7 days to try premium features for free. Only during your first week of ${BRAND_NAME}.`,
                className: 'ui-orange',
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: () => spotlight.setUpselling('free-trial'),
                },
            },
            [OnboardingMessage.SECURE_EXTENSION]: {
                id: 'pin',
                title: c('Title').t`Secure your data`,
                message: c('Info').t`Set up a PIN code to easily lock your data`,
                className: 'ui-violet',
                icon: ShieldIcon,
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('Label').t`Set PIN code`,
                    type: 'button',
                    onClick: withAcknowledgment(() => openSettings('security')),
                },
            },
            [OnboardingMessage.UPDATE_AVAILABLE]: {
                id: 'update',
                title: c('Title').t`Update available`,
                message: c('Info')
                    .t`A new version of ${PASS_APP_NAME} is available. Update it to enjoy the latest features and bug fixes.`,
                className: 'ui-orange',
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('Label').t`Update`,
                    type: 'button',
                    onClick: withAcknowledgment(() => browser.runtime.reload()),
                },
            },
            [OnboardingMessage.PERMISSIONS_REQUIRED]: {
                id: 'permissions',
                title: c('Title').t`Grant permissions`,
                message: c('Info')
                    .t`In order to get the best experience out of ${PASS_APP_NAME}, please grant the necessary extension permissions`,
                className: 'ui-orange',
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('Label').t`Grant`,
                    type: 'button',
                    onClick: withAcknowledgment(() => promptForPermissions()),
                },
            },
            [OnboardingMessage.USER_RATING]: {
                id: 'rating',
                title: c('Title').t`Enjoying ${PASS_APP_NAME}?`,
                message: c('Info').t`Please consider leaving a review.`,
                className: 'ui-lime',
                icon: FiveStarIcon,
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('Label').t`Rate us`,
                    type: 'button',
                    onClick: withAcknowledgment(() => window.open(webStoreURL, '_blank')),
                },
            },
            [OnboardingMessage.STORAGE_ISSUE]: {
                id: 'storage',
                title: c('Title').t`Low disk space`,
                message: c('Info')
                    .t`We are having trouble syncing data to your local storage. Please make sure you have sufficient disk space for ${PASS_SHORT_APP_NAME} to work smoothly.`,
                className: 'ui-red',
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('Label').t`Need help ?`,
                    type: 'button',
                    onClick: withAcknowledgment(() => openSettings('support')),
                },
            },
            [OnboardingMessage.BLACK_FRIDAY_OFFER]: {
                id: 'black-friday',
                title: c('bf2023: Title').t`Black Friday offer`,
                message: (() => {
                    const relativePrice = getSimplePriceString(user!.Currency, PASS_BF_MONTHLY_PRICE, '');
                    return c('bf2023: Info')
                        .t`Save Smart. Get a year of Pass Plus for only ${relativePrice} per month.`;
                })(),
                className: 'ui-orange',
                onClose: withAcknowledgment(noop),
                action: {
                    label: c('bf2023: Label').t`Get the deal`,
                    type: 'button',
                    onClick: withAcknowledgment(() =>
                        window.open(`${SSO_URL}/pass/dashboard?plan=pass2023&coupon=BF2023&cycle=12`, '_blank')
                    ),
                },
            },
        }),
        [message]
    );

    useEffect(() => {
        const handleMessage = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background') {
                switch (message.type) {
                    case WorkerMessageType.UPDATE_AVAILABLE:
                        setMessage(OnboardingMessage.UPDATE_AVAILABLE);
                        break;
                    case WorkerMessageType.PERMISSIONS_UPDATE:
                        setMessage(OnboardingMessage.PERMISSIONS_REQUIRED);
                        break;
                }
            }
        };

        void sendMessage.onSuccess(
            popupMessage({ type: WorkerMessageType.ONBOARDING_REQUEST }),
            async ({ message }) => {
                await wait(200);
                setMessage(message ?? null);
                if (message === OnboardingMessage.PENDING_SHARE_ACCESS) spotlight.setPendingShareAccess(true);
            }
        );

        extensionContext?.port.onMessage.addListener(handleMessage);
        return () => extensionContext?.port.onMessage.removeListener(handleMessage);
    }, [extensionContext]);

    useEffect(() => {
        const activeMessage = inviteMessage ?? (message !== null ? definitions[message] : null);
        spotlight.setMessage(activeMessage);
    }, [inviteMessage, message]);
};
