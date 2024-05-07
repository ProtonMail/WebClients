import { c } from 'ttag';

import { Button, Href } from '@proton/atoms/index';
import { ModalProps, Prompt, useSettingsLink } from '@proton/components/index';
import { ASSISTANT_FEATURE_NAME } from '@proton/llm/lib';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const AssistantIncompatibleBrowserModal = (props: ModalProps) => {
    const { onClose } = props;
    const goToSettings = useSettingsLink();

    const handleDownloadDesktopApp = () => {
        goToSettings('/get-the-apps#proton-mail-desktop-apps', APPS.PROTONMAIL, true);

        onClose?.();
    };

    /* translator:
     * Full string for reference: Sorry, your browser doesn't support AI Assistant. We're working to extend compatibility to more systems. You can try using the desktop app.
     */
    const modalText = c('loc_nightly_assistant')
        .t`Sorry, your browser doesn't support ${ASSISTANT_FEATURE_NAME}. We're working to extend compatibility to more systems. You can try using the desktop app.`;

    return (
        <Prompt
            title={c('loc_nightly_assistant').t`Browser not supported`}
            buttons={[
                <Button color="norm" onClick={handleDownloadDesktopApp}>{c('Action').t`Download Desktop App`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Got it`}</Button>,
            ]}
            {...props}
        >
            <span>{modalText}</span>
            <Href className="ml-2" href={getKnowledgeBaseUrl('/todo')}>
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
};

export default AssistantIncompatibleBrowserModal;
