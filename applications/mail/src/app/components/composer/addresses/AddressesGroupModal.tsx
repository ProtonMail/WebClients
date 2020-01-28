import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import { Checkbox, FormModal, generateUID, Label } from 'react-components';

import { ContactEmail } from '../../../models/contact';
import { contactToInput } from '../../../helpers/addresses';
import { RecipientGroup } from '../../../models/address';

interface Props {
    recipientGroup?: RecipientGroup;
    contacts: ContactEmail[];
    onClose?: () => void;
    onSubmit: (recipientGroup: RecipientGroup) => void;
}

const AddressesGroupModal = ({ onSubmit, onClose, recipientGroup, contacts, ...rest }: Props) => {
    const [uid] = useState(generateUID('addresses-group-modal'));
    const [model, setModel] = useState(recipientGroup as RecipientGroup);

    const isChecked = (contact: ContactEmail) =>
        !!model?.recipients.find((recipient) => contact.Email === recipient.Address);

    const handleChange = (contact: ContactEmail) => (event: ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        const recipients = model.recipients || [];
        let newValue;
        if (checked) {
            newValue = [
                ...recipients,
                { Name: contact.Name, Address: contact.Email, Group: recipientGroup?.group?.Path }
            ];
        } else {
            newValue = recipients.filter((recipient) => recipient.Address !== contact.Email);
        }
        setModel({ group: model?.group, recipients: newValue });
    };

    const handleSubmit = () => {
        onSubmit(model);
        onClose?.();
    };

    const members = c('Info').t`Members`;
    const title = `${recipientGroup?.group?.Name} (${contacts.length} ${members})`;

    return (
        <FormModal submit={c('Action').t`Save`} title={title} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ul className="unstyled">
                {contacts.map((contact) => {
                    const id = `${uid}-${contact.ID}`;
                    return (
                        <li key={contact.ID} className="mb0-5">
                            <Checkbox id={id} checked={isChecked(contact)} onChange={handleChange(contact)} />
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

export default AddressesGroupModal;
