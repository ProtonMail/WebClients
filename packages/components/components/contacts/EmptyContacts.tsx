import React from 'react';
import { c } from 'ttag';

import noContactsImgLight from 'design-system/assets/img/shared/empty-address-book.svg';
import noContactsImgDark from 'design-system/assets/img/shared/empty-address-book-dark.svg';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { noop } from 'proton-shared/lib/helpers/function';

import { useModals } from '../../hooks';

import ContactModal from '../../containers/contacts/modals/ContactModal';
import { PrimaryButton } from '../button';

interface Props {
    onClose?: () => void;
}

const EmptyContacts = ({ onClose = noop }: Props) => {
    const { createModal } = useModals();
    const title = c('Error message').t`No results found`;
    const image = getLightOrDark(noContactsImgLight, noContactsImgDark);

    const handleClick = () => {
        createModal(<ContactModal properties={[]} />);
        onClose();
    };

    return (
        <div className="flex flex-column flex-align-items-center flex-item-fluid p0-5">
            <span className="mb1">{c('Error message')
                .t`You do not have any contact yet. Start by creating a new contact`}</span>
            <img src={image} alt={title} className="p1 mb1" />
            <PrimaryButton onClick={handleClick}>{c('Action').t`Create new contact`}</PrimaryButton>
        </div>
    );
};

export default EmptyContacts;
