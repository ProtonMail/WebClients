import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { Form, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    emails: string[];
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithExpirationModal = ({ emails, onSubmit, onClose, ...rest }: Props) => {
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };

    const MAX_RECIPIENTS_DISPLAY = 10;

    const firstRecipients = emails.slice(0, MAX_RECIPIENTS_DISPLAY).join(', ');

    return (
        <ModalTwo as={Form} data-testid="composer:send-anyway" onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Send without expiration?`} />
            <ModalTwoContent>
                <p>
                    {emails.length <= 1
                        ? c('Info')
                              .t`Due to your recipient's configuration, this message can't be sent with an expiration date.`
                        : c('Info')
                              .t`Due to your recipient's configuration, this message can't be sent with an expiration date to ${firstRecipients}.`}
                    <br />
                    <br />
                    <Href href={getKnowledgeBaseUrl('/expiration')}>{c('Info').t`Learn more`}</Href>
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" type="submit">{c('Action').t`Send`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SendWithExpirationModal;
