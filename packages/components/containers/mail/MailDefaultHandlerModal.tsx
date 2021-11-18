import { c } from 'ttag';
import { registerMailToProtocolHandler } from 'proton-mail/src/app/helpers/url';
import { ConfirmModal } from '../../components/modal';
import { Href } from '../../components/link';

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
            title={c('Info').t`Set ProtonMail as your default mail handler`}
            confirm={c('Action').t`Prompt browser setting`}
            onConfirm={handleAskForPermission}
            onClose={rest.onClose}
            mode="alert"
            {...rest}
        >
            <span>{c('Info')
                .t`Activating this option will open a new composer each time you click on a mailto: link.`}</span>
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
