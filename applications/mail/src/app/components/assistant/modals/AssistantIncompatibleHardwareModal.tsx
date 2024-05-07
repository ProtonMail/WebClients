import { c } from 'ttag';

import { Button, Href } from '@proton/atoms/index';
import { ModalProps, Prompt } from '@proton/components/index';
import { ASSISTANT_FEATURE_NAME } from '@proton/llm/lib';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const AssistantIncompatibleHardwareModal = (props: ModalProps) => {
    const { onClose } = props;

    /* translator:
     * Full string for reference: Sorry, your system doesn't support AI Assistant. We're working to extend compatibility to more systems.
     */
    const modalText = c('loc_nightly_assistant')
        .t`Sorry, your system doesn't support ${ASSISTANT_FEATURE_NAME}. We're working to extend compatibility to more systems.`;

    return (
        <Prompt
            title={c('loc_nightly_assistant').t`Hardware not compatible`}
            buttons={[<Button onClick={onClose}>{c('Action').t`Got it`}</Button>]}
            {...props}
        >
            <span>{modalText}</span>
            <Href className="ml-2" href={getKnowledgeBaseUrl('/todo')}>
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
};

export default AssistantIncompatibleHardwareModal;
