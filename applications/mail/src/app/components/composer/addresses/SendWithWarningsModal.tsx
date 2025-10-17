import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Form, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    mapWarnings: { [key: string]: string[] };
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithWarningsModal = ({ mapWarnings, onSubmit, onClose, ...rest }: Props) => {
    const emails = Object.keys(mapWarnings);
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };
    return (
        <ModalTwo size="large" as={Form} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Confirm recipient address?`} />
            <ModalTwoContent>
                <span>
                    {c('Send email with warnings').ngettext(
                        msgid`We have detected some warnings. The following email address may not receive emails:`,
                        `We have detected some warnings. The following email addresses may not receive emails:`,
                        emails.length
                    )}
                </span>
                <ul>
                    {emails.map((email, index) => (
                        <li
                            key={index}  
                            className={clsx([index !== emails.length && 'mb-2'])}
                        >
                            <span className="block max-w-full">{`${mapWarnings[email].join(', ')} <${email}>`}</span>
                        </li>
                    ))}
                </ul>
                <span>{c('Send email with warnings').t`Do you want to send the email anyway?`}</span>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="norm">{c('Action').t`Send anyway`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SendWithWarningsModal;
