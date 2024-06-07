import { c } from 'ttag';

import { Button, Href } from '@proton/atoms/index';
import { ModalProps, Prompt, useApi, useEventManager } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    modalProps: ModalProps;
}

const AssistantIncompatibleHardwareModal = ({ modalProps }: Props) => {
    const { onClose } = modalProps;
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();

    const handleUpdateSetting = async () => {
        await withLoading(api(updateAIAssistant(AI_ASSISTANT_ACCESS.SERVER_ONLY)));
        await call();
        onClose?.();
    };

    /* translator:
     * Full string for reference: Sorry, your system doesn't support the writing assistant. We're working to extend compatibility to more systems.
     */
    const modalText = c('Info')
        .t`Your hardware doesn't support running the writing assistant locally. Try running it on ${BRAND_NAME} servers.`;

    return (
        <Prompt
            title={c('Header').t`Hardware not compatible`}
            buttons={[
                <Button color="norm" onClick={handleUpdateSetting} loading={loading}>{c('Action')
                    .t`Run on ${BRAND_NAME} servers`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Got it`}</Button>,
            ]}
            {...modalProps}
        >
            <span>{modalText}</span>
            <Href className="ml-2" href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')}>
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
};

export default AssistantIncompatibleHardwareModal;
