import { ChangeEvent, useMemo, useState } from 'react';

import { c } from 'ttag';

import {
    Button,
    Checkbox,
    Form,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    classnames,
    generateUID,
} from '@proton/components';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { contactToInput } from '@proton/shared/lib/mail/recipient';

import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { RecipientGroup } from '../../../models/address';
import { STATUS_ICONS_FILLS } from '../../../models/crypto';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';

interface Props {
    recipientGroup: RecipientGroup;
    contacts: ContactEmail[];
    messageSendInfo?: MessageSendInfo;
    onClose: () => void;
    onSubmit: (recipientGroup: RecipientGroup) => void;
    onExit?: () => void;
}

interface RowProps {
    messageSendInfo?: MessageSendInfo;
    contact: ContactEmail;
    uid: string;
    isChecked: (contact: ContactEmail) => boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const AddressesGroupModalRow = ({ contact, uid, isChecked, messageSendInfo, onChange }: RowProps) => {
    const id = `${uid}-${contact.ID}`;
    const sendInfo = messageSendInfo?.mapSendInfo[contact.Email];
    const icon = sendInfo?.sendIcon;
    const loading = sendInfo?.loading;
    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL && !loading;

    return (
        <li className="mb0-5">
            <Checkbox id={id} checked={isChecked(contact)} onChange={onChange} />
            <span className="min-w1-4e inline-flex align-middle">
                {(icon || loading) && <EncryptionStatusIcon loading={loading} {...icon} />}
            </span>
            <Label htmlFor={id} className={classnames(['pt0 pl0-5', cannotSend && 'color-danger'])}>
                {contactToInput(contact)}
            </Label>
        </li>
    );
};

const AddressesGroupModal = ({ recipientGroup, contacts, messageSendInfo, onSubmit, onClose, ...rest }: Props) => {
    const uid = useMemo<string>(() => generateUID('addresses-group-modal'), []);
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

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalTwoHeader title={`${recipientGroup?.group?.Name} (${contacts.length} ${members})`} />
            <ModalTwoContent>
                <ul className="unstyled">
                    {contacts.map((contact) => (
                        <AddressesGroupModalRow
                            key={contact.ID}
                            contact={contact}
                            uid={uid}
                            isChecked={isChecked}
                            messageSendInfo={messageSendInfo}
                            onChange={handleChange(contact)}
                        />
                    ))}
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <PrimaryButton type="submit" disabled={!allIconsLoaded}>{c('Action').t`Save`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AddressesGroupModal;
