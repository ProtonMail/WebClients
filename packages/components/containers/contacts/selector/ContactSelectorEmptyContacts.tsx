import { c } from 'ttag';
import noContactsImg from '@proton/styles/assets/img/illustrations/no-contacts.svg';
import noop from '@proton/utils/noop';
import { Button } from '../../../components';
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
        <div className="flex flex-column flex-align-items-center flex-item-fluid p0-5">
            <span className="mb1">{c('Error message')
                .t`You do not have any contact yet. Start by creating a new contact`}</span>
            <img src={noContactsImg} alt={title} className="p1 mb1" />
            <Button color="norm" onClick={handleClick}>{c('Action').t`Create new contact`}</Button>
        </div>
    );
};

export default ContactSelectorEmptyContacts;
