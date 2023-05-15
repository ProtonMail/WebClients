import { c } from 'ttag';

import { Button } from '@proton/atoms';
import noContactsImg from '@proton/styles/assets/img/illustrations/no-contacts.svg';
import noop from '@proton/utils/noop';

import { ContactEditProps } from '../edit/ContactEditModal';

interface Props {
    onClose?: () => void;
    onEdit: (props: ContactEditProps) => void;
}

const ContactSelectorEmptyContacts = ({ onEdit, onClose = noop }: Props) => {
    const title = c('Error message').t`No results found`;

    const handleClick = () => {
        onEdit({});
        onClose();
    };

    return (
        <div className="flex flex-column flex-align-items-center flex-item-fluid p-2">
            <span className="mb-4">{c('Error message')
                .t`You do not have any contact yet. Start by creating a new contact`}</span>
            <img src={noContactsImg} alt={title} className="p-4 mb-4" />
            <Button color="norm" onClick={handleClick}>{c('Action').t`Create new contact`}</Button>
        </div>
    );
};

export default ContactSelectorEmptyContacts;
