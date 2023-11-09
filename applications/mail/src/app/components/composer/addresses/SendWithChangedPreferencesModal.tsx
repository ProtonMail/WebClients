import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Form, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import clsx from '@proton/utils/clsx';

export enum PREFERENCE_CHANGE_TYPE {
    E2EE_DISABLED,
    CONTACT_DELETED,
}

interface Props {
    emails: string[];
    changeType: PREFERENCE_CHANGE_TYPE;
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithChangedPreferencesModal = ({ emails, changeType, onSubmit, onClose, ...rest }: Props) => {
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };

    const title =
        changeType === PREFERENCE_CHANGE_TYPE.CONTACT_DELETED
            ? c('Title').t`Send with changed preferences?`
            : c('Title').t`Send with encryption disabled?`;

    const content =
        changeType === PREFERENCE_CHANGE_TYPE.CONTACT_DELETED
            ? c('Send email with changed preferences')
                  .t`The contacts for the following addresses have been deleted, so the corresponding encryption preferences have been updated accordingly:`
            : c('Send email with encryption disabled')
                  .t`The contacts for the following addresses have disabled end-to-end encryption on their account, so the corresponding encryption preferences have been updated accordingly:`;

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                {content}
                <br />
                <ul>
                    {emails.map((email, index) => (
                        <li
                            key={index} // eslint-disable-line react/no-array-index-key
                            className={clsx([index !== emails.length && 'mb-2'])}
                        >
                            <span className="block max-w-full">{email}</span>
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
