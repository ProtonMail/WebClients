import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Href from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import {
    addIPCHostUpdateListener,
    getInboxDesktopInfo,
    hasInboxDesktopFeature,
    invokeInboxDesktopIPC,
} from '@proton/shared/lib/desktop/ipcHelpers';
import { isMac, isWindows } from '@proton/shared/lib/helpers/browser';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import useFlag from '@proton/unleash/useFlag';

interface DefaultAppPromptProps extends ModalProps {
    setDefault: () => void;
}

function DefaultAppPrompt({ setDefault, onClose, ...props }: DefaultAppPromptProps) {
    return (
        <Prompt
            title={c('Info').t`Default email application`}
            buttons={[
                <Button color="norm" onClick={setDefault}>{c('Action').t`Set as default`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...props}
        >
            <span>{c('Info')
                .t`Set ${MAIL_APP_NAME} as your default email application. ${MAIL_APP_NAME} will open automatically when you click an email link.`}</span>
            <Href
                className="ml-2"
                href={getKnowledgeBaseUrl('/set-default-email-handler')}
                title="Default mail handler"
            >
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
}

export function useElectronDefaultApp() {
    const defaultAppEnabled = useFlag('InboxDesktopDefaultEmailSetupHelper');
    const defaultAppDisabled = useFlag('InboxDesktopDefaultEmailSetupHelperDisabled');

    const enabled =
        defaultAppEnabled && !defaultAppDisabled && (isWindows() || isMac()) && hasInboxDesktopFeature('MailtoUpdate');

    const [isDefault, setIsDefault] = useState(false);
    const [shouldCheck, setShouldCheck] = useState(false);
    const [modalProps, setModalOpen] = useModalState();

    const updateShouldCheck = useCallback(
        async (nextShouldNext: boolean) => {
            if (enabled) {
                await invokeInboxDesktopIPC({ type: 'setShouldCheckDefaultMailto', payload: nextShouldNext });
                const defaultMailTo = getInboxDesktopInfo('defaultMailto');
                setShouldCheck(defaultMailTo.shouldBeDefault);
            }
        },
        [enabled]
    );

    const updateIsDefault = useCallback(async () => {
        if (!enabled) {
            return;
        }

        await invokeInboxDesktopIPC({ type: 'setDefaultMailto' });

        if (isMac()) {
            setShouldCheck(true);
            setIsDefault(true);
            setModalOpen(false);
            return;
        }

        // On windows we need to wait until user has selected our app as default
        // in the OS settings, so we will be polling the defaultMailTo protocol
        // until it has been selected, or a 30s timeout passes.

        let intervalId: ReturnType<typeof setInterval>;
        let timeoutId: ReturnType<typeof setTimeout>;

        const closeModal = () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            setModalOpen(false);
        };

        intervalId = setInterval(async () => {
            await invokeInboxDesktopIPC({ type: 'checkDefaultMailtoAndSignal' });
            const defaultMailTo = getInboxDesktopInfo('defaultMailto');

            if (defaultMailTo.isDefault) {
                closeModal();
            }
        }, 2000);

        timeoutId = setTimeout(() => {
            closeModal();
        }, 30000);
    }, [enabled]);

    const triggerPrompt = useCallback(async () => {
        if (enabled) {
            setModalOpen(true);
        }
    }, [enabled]);

    useEffect(() => {
        if (enabled) {
            const defaultMailTo = getInboxDesktopInfo('defaultMailto');
            setIsDefault(defaultMailTo.isDefault);
            setShouldCheck(defaultMailTo.shouldBeDefault);

            const handler = addIPCHostUpdateListener('defaultMailtoChecked', (payload) => {
                setIsDefault(payload.isDefault);
                setShouldCheck(payload.shouldBeDefault);
            });

            return () => {
                handler.removeListener();
            };
        }
    }, [enabled]);

    const Prompt = enabled ? <DefaultAppPrompt setDefault={updateIsDefault} {...modalProps} /> : null;
    return { enabled, isDefault, shouldCheck, setShouldCheck: updateShouldCheck, triggerPrompt, Prompt } as const;
}
