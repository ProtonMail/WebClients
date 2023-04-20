import { type VFC, useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import { type Callback, Maybe, OnboardingMessage, WorkerMessageType } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useOpenSettingsTab } from '../../hooks/useOpenSettingsTab';
import { OnboardingContent, type OnboardingMessageDefinition } from './OnboardingContent';

import './OnboardingPanel.scss';

export const OnboardingPanel: VFC = () => {
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

    /* Ensure acknowledge message goes through by waiting for
     * next tick in case we close the popup in the callback */
    const withAcknowledge = useCallback(
        (message: OnboardingMessage, cb: Callback = noop) =>
            async () => {
                await sendMessage.onSuccess(
                    popupMessage({
                        type: WorkerMessageType.ONBOARDING_ACK,
                        payload: { message },
                    }),
                    () => {
                        setOpen(false);
                        cb();
                    }
                );
            },
        []
    );

    const definitions = useMemo<{ [K in OnboardingMessage]: OnboardingMessageDefinition }>(
        () => ({
            [OnboardingMessage.WELCOME]: {
                title: c('Title').t`Why ${PASS_APP_NAME}?`,
                message: c('Info').t`Privacy is a big concern for us. Learn why ${PASS_APP_NAME} is different.`,
                className: 'ui-alias',
                action: {
                    label: c('Label').t`Learn more`,
                    onClick: () => browser.tabs.create({ url: 'https://proton.me' }),
                },
            },
            [OnboardingMessage.SECURE_EXTENSION]: {
                title: c('Title').t`Secure your data`,
                message: c('Info').t`Set up a PIN code to easily lock your data`,
                className: 'ui-login',
                action: {
                    label: c('Label').t`Set PIN code`,
                    onClick: () => openSettings('security'),
                },
            },
        }),
        []
    );

    const currentMessage = message !== undefined ? definitions[message] : null;

    return (
        <div className={clsx('pass-onboarding-panel', !open && 'pass-onboarding-panel--hidden')}>
            {currentMessage && (
                <OnboardingContent
                    className={currentMessage.className}
                    title={currentMessage.title}
                    message={currentMessage.message}
                    onClose={withAcknowledge(message!)}
                    action={
                        currentMessage.action
                            ? {
                                  label: currentMessage.action.label,
                                  onClick: withAcknowledge(message!, currentMessage.action.onClick),
                              }
                            : undefined
                    }
                />
            )}
        </div>
    );
};
