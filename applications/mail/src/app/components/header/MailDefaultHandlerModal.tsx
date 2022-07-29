import { c } from 'ttag';

import { AlertModal, Button, ModalProps } from '@proton/components';
import { Href } from '@proton/components/components/link';
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
        <AlertModal
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
                className="ml0-5"
                url={getKnowledgeBaseUrl('/set-default-email-handler')}
                title="Default mail handler"
            >
                {c('Info').t`Learn more`}
            </Href>
        </AlertModal>
    );
};

export default MailDefaultHandlerModal;
