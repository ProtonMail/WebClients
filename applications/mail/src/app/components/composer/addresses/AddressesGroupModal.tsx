import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import { Checkbox, FormModal, generateUID, Label, classnames, PrimaryButton } from 'react-components';

import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';

import { contactToInput } from '../../../helpers/addresses';
import { RecipientGroup } from '../../../models/address';
import { STATUS_ICONS_FILLS } from '../../../models/crypto';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import { MessageSendInfo } from '../../../hooks/useSendInfo';

interface Props {
    recipientGroup: RecipientGroup;
    contacts: ContactEmail[];
    messageSendInfo?: MessageSendInfo;
    onClose: () => void;
    onSubmit: (recipientGroup: RecipientGroup) => void;
}

const AddressesGroupModal = ({ recipientGroup, contacts, messageSendInfo, onSubmit, onClose, ...rest }: Props) => {
    const [uid] = useState<string>(generateUID('addresses-group-modal'));
    const [model, setModel] = useState<RecipientGroup>(recipientGroup);

    const allIconsLoaded = !contacts.some(({ Email }) => messageSendInfo?.mapSendInfo?.[Email]?.loading === true);
    const isChecked = (contact: ContactEmail) =>
        !!model?.recipients?.find((recipient) => contact.Email === recipient.Address);

    const handleChange = (contact: ContactEmail) => (event: ChangeEvent<HTMLInputElement>) => {
        const { checked } = event.target;
        const recipients = model.recipients || [];
        let newValue;
        if (checked) {
            newValue = [
                ...recipients,
                { Name: contact.Name, Address: contact.Email, Group: recipientGroup?.group?.Path },
            ];
        } else {
            newValue = recipients.filter((recipient) => recipient.Address !== contact.Email);
        }
        setModel({ group: model?.group, recipients: newValue });
    };

    const handleSubmit = () => {
        onSubmit(model);
        onClose();
    };

    const members = c('Info').t`Members`;
    const title = `${recipientGroup?.group?.Name} (${contacts.length} ${members})`;

    const submit = <PrimaryButton type="submit" disabled={!allIconsLoaded}>{c('Action').t`Save`}</PrimaryButton>;

    return (
        <FormModal submit={submit} title={title} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ul className="unstyled">
                {contacts.map((contact) => {
                    const id = `${uid}-${contact.ID}`;
                    const sendInfo = messageSendInfo?.mapSendInfo[contact.Email];
                    const icon = sendInfo?.sendIcon;
                    const loading = sendInfo?.loading;
                    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL && !loading;
                    return (
                        <li key={contact.ID} className="mb0-5">
                            <Checkbox id={id} checked={isChecked(contact)} onChange={handleChange(contact)} />
                            <span className="min-w1-4e inline-flex alignmiddle">
                                {(icon || loading) && <EncryptionStatusIcon loading={loading} {...icon} />}
                            </span>
                            <Label
                                htmlFor={id}
                                className={classnames(['pt0 pl0-5', cannotSend && 'color-global-warning'])}
                            >
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
