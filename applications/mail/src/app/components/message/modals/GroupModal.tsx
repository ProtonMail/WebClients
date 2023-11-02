import { useState } from 'react';

import { c } from 'ttag';

import { Checkbox, FormModal, Label, generateUID } from '@proton/components';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { contactToInput } from '@proton/shared/lib/mail/recipient';

import { GroupWithContacts } from '../../../logic/contacts/contactsTypes';
import { RecipientGroup } from '../../../models/address';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import EncryptionStatusIcon from '../EncryptionStatusIcon';

interface Props {
    recipientGroup: RecipientGroup;
    group: GroupWithContacts | undefined;
    globalIcon?: StatusIcon;
    mapStatusIcons?: MapStatusIcons;
    onClose?: () => void;
}

const GroupModal = ({ recipientGroup, group, globalIcon, mapStatusIcons, onClose, ...rest }: Props) => {
    const [uid] = useState<string>(generateUID('header-group-modal'));

    const contacts = group?.contacts || [];

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
                    const icon = globalIcon || (mapStatusIcons ? mapStatusIcons[contact.Email] : undefined);
                    return (
                        <li key={contact.ID} className="mb-2">
                            <Checkbox id={id} checked={isChecked(contact)} disabled />
                            <span className="min-w-custom inline-flex align-middle" style={{'--min-w-custom': '1.4em'}}>
                                {icon && <EncryptionStatusIcon {...icon} />}
                            </span>
                            <Label htmlFor={id} className="pt-0 pl-1">
                                {contactToInput(contact)}
                            </Label>
                        </li>
                    );
                })}
            </ul>
        </FormModal>
    );
};

export default GroupModal;
