import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { registerMailToProtocolHandler } from '../../helpers/url';

const MailDefaultHandlerModal = (props: ModalProps) => {
    const { onClose } = props;

    const handleAskForPermission = () => {
        registerMailToProtocolHandler();

        onClose?.();
    };

    return (
        <Prompt
            title={c('Info').t`Default email application`}
            buttons={[
                <Button color="norm" onClick={handleAskForPermission}>{c('Action').t`Set as default`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...props}
        >
            <span>{c('Info')
                .t`Set ${MAIL_APP_NAME} as your default email application for this browser. ${MAIL_APP_NAME} will open automatically when you click an email link.`}</span>
            <Href
                className="ml-2"
                href={getKnowledgeBaseUrl('/set-default-email-handler')}
                title="Default mail handler"
            >
                {c('Info').t`Learn more`}
            </Href>
        </Prompt>
    );
};

export default MailDefaultHandlerModal;
