import { c, msgid } from 'ttag';

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
    return (
        <ModalTwo as={Form} data-testid="composer:send-anyway" onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Send without expiration?`} />
            <ModalTwoContent>
                <p>
                    {
                        // translator - Complete sentence: Due to your recipient's configuration, this message can't be sent with an expiration date to the following contact: email1@provider.com, email2@provider.com, etc.
                        c('Info').ngettext(
                            msgid`Due to your recipient's configuration, this message can't be sent with an expiration date to the following contact: `,
                            `Due to your recipient's configuration, this message can't be sent with an expiration date to the following contacts: `,
                            emails.length
                        ) +
                            emails.slice(0, 10).join(', ') +
                            (emails.length > 10 ? ` ${c('Info').t`and more.`}` : '')
                    }
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
