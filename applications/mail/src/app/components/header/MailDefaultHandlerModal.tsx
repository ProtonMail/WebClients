import { c } from 'ttag';
import { AlertModal, Button, ModalProps } from '@proton/components';
import { Href } from '@proton/components/components/link';
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
                .t`Set ProtonMail as your default email application for this browser. ProtonMail will open automatically when you click an email link.`}</span>
            <Href
                className="ml0-5"
                url="https://protonmail.com/support/knowledge-base/set-default-email-handler/"
                title="Default mail handler"
            >
                {c('Info').t`Learn more`}
            </Href>
        </AlertModal>
    );
};

export default MailDefaultHandlerModal;
