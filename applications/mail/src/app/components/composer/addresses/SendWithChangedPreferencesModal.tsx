import { c } from 'ttag';

import {
    Button,
    Form,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    classnames,
} from '@proton/components';

interface Props {
    emails: string[];
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithChangedPreferencesModal = ({ emails, onSubmit, onClose, ...rest }: Props) => {
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Send with changed preferences?`} />
            <ModalTwoContent>
                {c('Send email with changed preferences')
                    .t`The contacts for the following addresses have been deleted, so the corresponding encryption preferences have been updated accordingly:`}
                <br />
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
                <Button color="norm" type={'submit'}>{c('Action').t`Send anyway`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SendWithChangedPreferencesModal;
