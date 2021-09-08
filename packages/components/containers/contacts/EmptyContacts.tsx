import { c } from 'ttag';
import noContactsImg from '@proton/styles/assets/img/placeholders/empty-address-book.svg';
import { noop } from '@proton/shared/lib/helpers/function';

import { Button } from '../../components';
import { useModals } from '../../hooks';
import ContactModal from './modals/ContactModal';

interface Props {
    onClose?: () => void;
}

const EmptyContacts = ({ onClose = noop }: Props) => {
    const { createModal } = useModals();
    const title = c('Error message').t`No results found`;

    const handleClick = () => {
        createModal(<ContactModal properties={[]} />);
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

export default EmptyContacts;
