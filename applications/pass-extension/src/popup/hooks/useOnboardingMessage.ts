import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { detectBrowser, getWebStoreUrl } from '@proton/pass/lib/extension/utils/browser';
import browser from '@proton/pass/lib/globals/browser';
import type { Callback, MaybeNull, WorkerMessageWithSender } from '@proton/pass/types';
import { OnboardingMessage, WorkerMessageType } from '@proton/pass/types';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { promptForPermissions } from '../../shared/extension/permissions';
import { useExtensionContext } from '../../shared/hooks';
import type { SpotlightMessageDefinition } from '../components/Spotlight/SpotlightContent';
import { FiveStarIcon, ShieldIcon } from '../components/Spotlight/SpotlightIcon';
import { useOpenSettingsTab } from './useOpenSettingsTab';

export const useOnboardingMessage = () => {
    const { context: extensionContext } = useExtensionContext();
    const webStoreURL = getWebStoreUrl(detectBrowser());
    const [showTrial, setShowTrial] = useState<boolean>(false);
    const [message, setMessage] = useState<MaybeNull<OnboardingMessage>>(null);

    useEffect(() => {
        void sendMessage.onSuccess(
            popupMessage({ type: WorkerMessageType.ONBOARDING_REQUEST }),
            async ({ message }) => {
                await wait(200);
                setMessage(message ?? null);
            }
        );
    }, []);

    const openSettings = useOpenSettingsTab();

    const withAcknowledgment = useCallback(
        (cb: Callback = noop) =>
            () => {
                if (message) {
                    void sendMessage(popupMessage({ type: WorkerMessageType.ONBOARDING_ACK, payload: { message } }));
                }

                cb();
                setMessage(null);
            },
        [message]
    );

    const definitions = useMemo<{ [K in OnboardingMessage]: SpotlightMessageDefinition }>(
        () => ({
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
                title: c('Title').t`Enjoy your free trial`,
                message: c('Info')
                    .t`Check out all the exclusive features that are available to you for a limited time.`,
                className: 'ui-orange',
                onClose: withAcknowledgment(() => setShowTrial(false)),
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: () => setShowTrial(true),
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

        extensionContext?.port.onMessage.addListener(handleMessage);
        return () => extensionContext?.port.onMessage.removeListener(handleMessage);
    }, [extensionContext]);

    return useMemo(
        () => ({
            message: message !== null ? definitions[message] : null,
            trial: showTrial,
        }),
        [message, showTrial]
    );
};
