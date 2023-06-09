import { type VFC, useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import type { Maybe, WorkerMessageWithSender } from '@proton/pass/types';
import { type Callback, OnboardingMessage, WorkerMessageType } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { promptForPermissions } from '../../../shared/extension/permissions';
import { useExtensionContext } from '../../../shared/hooks';
import { useOpenSettingsTab } from '../../hooks/useOpenSettingsTab';
import { OnboardingContent, type OnboardingMessageDefinition } from './OnboardingContent';
import { OnboardingShieldIcon } from './OnboardingIcon';

import './OnboardingPanel.scss';

export const OnboardingPanel: VFC = () => {
    const { context: extensionContext } = useExtensionContext();

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState<Maybe<OnboardingMessage>>();

    useEffect(() => {
        void sendMessage.onSuccess(
            popupMessage({ type: WorkerMessageType.ONBOARDING_REQUEST }),
            async ({ message }) => {
                await wait(200);
                setMessage(message);
                setOpen(message !== undefined);
            }
        );
    }, []);

    const openSettings = useOpenSettingsTab();

    const withAcknowledge = useCallback(
        (message: OnboardingMessage, cb: Callback = noop) =>
            async () => {
                void sendMessage.onSuccess(
                    popupMessage({
                        type: WorkerMessageType.ONBOARDING_ACK,
                        payload: { message },
                    }),
                    () => {}
                );

                cb();
                setOpen(false);
            },
        []
    );

    const definitions = useMemo<{ [K in OnboardingMessage]: OnboardingMessageDefinition }>(
        () => ({
            [OnboardingMessage.WELCOME]: {
                title: c('Title').t`Why ${PASS_APP_NAME}?`,
                message: c('Info').t`Privacy is a big concern for us. Learn why ${PASS_APP_NAME} is different.`,
                className: 'ui-alias',
                icon: <OnboardingShieldIcon />,
                action: {
                    label: c('Label').t`Learn more`,
                    type: 'link',
                    onClick: () => browser.tabs.create({ url: 'https://proton.me/pass' }),
                },
            },
            [OnboardingMessage.SECURE_EXTENSION]: {
                title: c('Title').t`Secure your data`,
                message: c('Info').t`Set up a PIN code to easily lock your data`,
                className: 'ui-login',
                icon: <OnboardingShieldIcon />,
                action: {
                    label: c('Label').t`Set PIN code`,
                    type: 'button',
                    onClick: () => openSettings('security'),
                },
            },
            [OnboardingMessage.UPDATE_AVAILABLE]: {
                title: c('Title').t`Update available`,
                message: c('Info')
                    .t`A new version of ${PASS_APP_NAME} is available. Update it to enjoy the latest features and bug fixes.`,
                className: 'ui-note',
                action: {
                    label: c('Label').t`Update`,
                    type: 'button',
                    onClick: () => browser.runtime.reload(),
                },
            },
            [OnboardingMessage.PERMISSIONS_REQUIRED]: {
                title: c('Title').t`Grant permissions`,
                message: c('Info')
                    .t`In order to get the best experience out of ${PASS_APP_NAME}, please grant the necessary extension permissions`,
                className: 'ui-note',
                action: {
                    label: c('Label').t`Grant`,
                    type: 'button',
                    onClick: () => promptForPermissions(),
                },
            },
        }),
        []
    );

    useEffect(() => {
        const handleMessage = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background') {
                switch (message.type) {
                    case WorkerMessageType.UPDATE_AVAILABLE:
                        setMessage(OnboardingMessage.UPDATE_AVAILABLE);
                        setOpen(true);
                    case WorkerMessageType.PERMISSIONS_UPDATE:
                        setMessage(OnboardingMessage.PERMISSIONS_REQUIRED);
                        setOpen(true);
                }
            }
        };

        extensionContext?.port.onMessage.addListener(handleMessage);
        return () => extensionContext?.port.onMessage.removeListener(handleMessage);
    }, [extensionContext]);

    const currentMessage = message !== undefined ? definitions[message] : null;

    return (
        <div className={clsx('pass-onboarding-panel', !open && 'pass-onboarding-panel--hidden')}>
            {currentMessage && (
                <OnboardingContent
                    className={currentMessage.className}
                    title={currentMessage.title}
                    message={currentMessage.message}
                    icon={currentMessage.icon}
                    onClose={withAcknowledge(message!)}
                    action={
                        currentMessage.action
                            ? {
                                  label: currentMessage.action.label,
                                  type: currentMessage.action.type,
                                  onClick: withAcknowledge(message!, currentMessage.action.onClick),
                              }
                            : undefined
                    }
                />
            )}
        </div>
    );
};
