import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { useApi, useEventManager } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    modalProps: ModalProps;
    onResolve?: () => void;
    onReject?: () => void;
}

const AssistantIncompatibleHardwareModal = ({ modalProps, onReject, onResolve }: Props) => {
    const { createNotification } = useNotifications();
    const { onClose } = modalProps;
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();

    const handleUpdateSetting = async () => {
        await withLoading(api(updateAIAssistant(AI_ASSISTANT_ACCESS.SERVER_ONLY)));
        createNotification({ text: c('Success').t`Writing assistant setting updated` });
        await call();
        onResolve?.();
        onClose?.();
    };

    const handleClose = () => {
        onReject?.();
        onClose?.();
    };

    /* translator:
     * Full string for reference: Sorry, your system doesn't support the writing assistant. We're working to extend compatibility to more systems.
     */
    const modalText = c('Info')
        .t`Your hardware doesn't support running the writing assistant locally. Try running it on servers.`;

    return (
        <Prompt
            title={c('Header').t`Hardware not compatible`}
            buttons={[
                <Button color="norm" onClick={handleUpdateSetting} loading={loading}>{c('Action')
                    .t`Run on ${BRAND_NAME} servers`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
            onClose={handleClose}
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

export default AssistantIncompatibleHardwareModal;
