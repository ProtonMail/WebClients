import { c } from 'ttag';
import { ConfirmModal } from '@proton/components/components/modal';
import { Href } from '@proton/components/components/link';
import { registerMailToProtocolHandler } from '../../helpers/url';

interface Props {
    onClose?: () => void;
}

const MailDefaultHandlerModal = ({ ...rest }: Props) => {
    const handleAskForPermission = () => {
        registerMailToProtocolHandler();

        if (rest.onClose) {
            rest.onClose();
        }
    };

    return (
        <ConfirmModal
            title={c('Info').t`Default email application`}
            confirm={c('Action').t`Set as default`}
            onConfirm={handleAskForPermission}
            onClose={rest.onClose}
            mode="alert"
            {...rest}
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
        </ConfirmModal>
    );
};

export default MailDefaultHandlerModal;
