import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, type GroupWithContacts, Label } from '@proton/components';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { contactToInput } from '@proton/shared/lib/mail/recipient';
import generateUID from '@proton/utils/generateUID';

import type { RecipientGroup } from '../../../models/address';
import type { MapStatusIcons, StatusIcon } from '../../../models/crypto';
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
        <ModalTwo onClose={onClose} {...rest}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <ul className="unstyled">
                    {contacts.map((contact) => {
                        const id = `${uid}-${contact.ID}`;
                        const icon = globalIcon || (mapStatusIcons ? mapStatusIcons[contact.Email] : undefined);
                        return (
                            <li key={contact.ID} className="mb-2">
                                <Checkbox id={id} checked={isChecked(contact)} disabled />
                                <span
                                    className="min-w-custom inline-flex align-middle"
                                    style={{ '--min-w-custom': '1.4em' }}
                                >
                                    {icon && <EncryptionStatusIcon {...icon} />}
                                </span>
                                <Label htmlFor={id} className="pt-0 pl-1">
                                    {contactToInput(contact)}
                                </Label>
                            </li>
                        );
                    })}
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default GroupModal;
