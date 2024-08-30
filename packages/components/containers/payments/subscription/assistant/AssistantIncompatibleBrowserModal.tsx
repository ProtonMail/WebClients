import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Prompt, useApi, useEventManager, useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    modalProps: ModalProps;
    onResolve?: () => void;
    onReject?: () => void;
}

/**
 * TODO: Revert this later
 * We currently have an issue on the desktop app where it's not possible to run the assistant locally,
 * because "shader-f16" is missing.
 * We need to remove desktop app mentions from this modal for the release, and put them back once we have a fix
 */
const AssistantIncompatibleBrowserModal = ({ modalProps, onReject, onResolve }: Props) => {
    const { createNotification } = useNotifications();
    const { onClose } = modalProps;
    // const goToSettings = useSettingsLink();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();

    const handleRejectThenClose = () => {
        onReject?.();
        onClose?.();
    };

    const handleUpdateSetting = async () => {
        await withLoading(api(updateAIAssistant(AI_ASSISTANT_ACCESS.SERVER_ONLY)));
        createNotification({ text: c('Success').t`Writing assistant setting updated` });
        await call();
        onResolve?.();
        onClose?.();
    };

    /* translator:
     * Full string for reference: Your browser doesn’t support the writing assistant. Try running it on Proton servers.
     */
    const modalText = c('Info').t`Your browser doesn't support the writing assistant. Try running it on servers.`;

    const buttons: [JSX.Element, JSX.Element] | [JSX.Element, JSX.Element, JSX.Element] = (() => {
        return [
            <Button color="norm" onClick={handleUpdateSetting} loading={loading}>{c('Action')
                .t`Run on servers`}</Button>,
            <Button onClick={handleRejectThenClose}>{c('Action').t`Cancel`}</Button>,
        ];
    })();

    return (
        <Prompt
            title={c('Info').t`Browser not supported`}
            buttons={buttons}
            {...modalProps}
            onClose={handleRejectThenClose}
        >
            <span className="mr-1">{modalText}</span>
            <Href
                className="inline-block"
                href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant#local-or-server')}
            >
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
};

export default AssistantIncompatibleBrowserModal;
