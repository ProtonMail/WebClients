import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import {
    Checkbox,
    Form,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
} from '@proton/components';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { ENCRYPTION_PREFERENCES_ERROR_TYPES } from '@proton/shared/lib/mail/encryptionPreferences';
import { contactToInput } from '@proton/shared/lib/mail/recipient';
import clsx from '@proton/utils/clsx';

import type { MessageSendInfo } from '../../../hooks/useSendInfo';
import type { RecipientGroup } from '../../../models/address';
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
    const shouldHaveHref =
        sendInfo?.encryptionPreferenceError !== ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR;

    return (
        <li className="mb-2">
            <Checkbox id={id} checked={isChecked(contact)} onChange={onChange} className="mr-2" />
            <span className="min-w-custom inline-flex align-middle" style={{ '--min-w-custom': '1.4em' }}>
                {(icon || loading) && (
                    <EncryptionStatusIcon loading={loading} {...icon} shouldHaveHref={shouldHaveHref} />
                )}
            </span>
            <Label htmlFor={id} className={clsx(['pt-0 pl-2 align-middle text-break', cannotSend && 'color-danger'])}>
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
