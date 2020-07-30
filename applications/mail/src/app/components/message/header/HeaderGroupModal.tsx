import React, { useState } from 'react';
import { c } from 'ttag';
import { Checkbox, FormModal, generateUID, Label } from 'react-components';

import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';

import { contactToInput } from '../../../helpers/addresses';
import { RecipientGroup } from '../../../models/address';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import { getContactsOfGroup } from '../../../helpers/contacts';

interface Props {
    recipientGroup: RecipientGroup;
    contacts: ContactEmail[];
    globalIcon?: StatusIcon;
    mapStatusIcons?: MapStatusIcons;
    onClose?: () => void;
}

const HeaderGroupModal = ({
    recipientGroup,
    contacts: allContacts,
    globalIcon,
    mapStatusIcons,
    onClose,
    ...rest
}: Props) => {
    const [uid] = useState<string>(generateUID('header-group-modal'));

    const contacts = getContactsOfGroup(allContacts, recipientGroup.group?.ID);

    const isChecked = (contact: ContactEmail) =>
        !!recipientGroup.recipients?.find((recipient) => contact.Email === recipient.Address);

    const members = c('Info').t`Members`;
    const title = `${recipientGroup?.group?.Name} (${contacts.length} ${members})`;

    return (
        <FormModal
            title={title}
            submit={c('Action').t`Close`}
            close={null}
            onSubmit={onClose}
            onClose={onClose}
            {...rest}
        >
            <ul className="unstyled">
                {contacts.map((contact) => {
                    const id = `${uid}-${contact.ID}`;
                    const icon = globalIcon ? globalIcon : mapStatusIcons ? mapStatusIcons[contact.Email] : undefined;
                    return (
                        <li key={contact.ID} className="mb0-5">
                            <Checkbox id={id} checked={isChecked(contact)} disabled={true} />
                            <span className="min-w1-4e inline-flex alignmiddle">
                                {icon && <EncryptionStatusIcon {...icon} />}
                            </span>
                            <Label htmlFor={id} className="pt0 pl0-5">
                                {contactToInput(contact)}
                            </Label>
                        </li>
                    );
                })}
            </ul>
        </FormModal>
    );
};

export default HeaderGroupModal;
