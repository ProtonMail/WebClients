import { c, msgid } from 'ttag';

import {
    Button,
    Form,
    Href,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    classnames,
} from '@proton/components';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
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
        <ModalTwo
            size="large"
            as={Form}
            data-testid="composer:send-anyway"
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <ModalTwoHeader title={c('Title').t`Send without expiration?`} />
            <ModalTwoContent>
                <div className="mb0-5">
                    {c('Info')
                        .t`Message expiration works out-of-the-box when sending emails to other ${MAIL_APP_NAME} users. To send expiring emails to non-${BRAND_NAME} users, please cancel and add password protection to your email.`}
                    <br />
                    <Href url={getKnowledgeBaseUrl('/expiration')}>{c('Info').t`Learn more`}</Href>
                </div>
                <span>
                    {c('Send email with warnings').ngettext(
                        msgid`If you decide to send the message anyway, the following recipient will receive the email without expiration:`,
                        `If you decide to send the message anyway, the following recipients will receive the email without expiration:`,
                        emails.length
                    )}
                </span>

                <ul>
                    {emails.map((email, index) => (
                        <li
                            key={index} // eslint-disable-line react/no-array-index-key
                            className={classnames([index !== emails.length && 'mb0-5'])}
                        >
                            <span className="block max-w100">{email}</span>
                        </li>
                    ))}
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit">{c('Action').t`Send anyway`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SendWithExpirationModal;
