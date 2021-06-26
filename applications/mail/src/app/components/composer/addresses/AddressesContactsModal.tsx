import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import { Table, TableHeader, Checkbox, TableRow, TableBody, FormModal, SearchInput } from 'react-components';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import AddressesRecipientItem from './AddressesRecipientItem';

interface Props {
    inputValue?: Recipient[];
    allContacts?: ContactEmail[];
    messageSendInfo: MessageSendInfo;
    onClose?: () => void;
    onSubmit: (recipients: Recipient[]) => void;
}

const AddressesContactsModal = ({
    messageSendInfo,
    inputValue = [],
    onSubmit,
    onClose,
    allContacts = [],
    ...rest
}: Props) => {
    const [value, setValue] = useState(inputValue);
    const [contacts, setContacts] = useState<ContactEmail[]>(allContacts);

    const handleChangeSearch = (searchInput = '') => {
        const search = searchInput.toLowerCase();
        const contacts = allContacts?.filter(
            (contact) => contact.Name?.toLowerCase().includes(search) || contact.Email?.toLowerCase().includes(search)
        );
        setContacts(contacts || []);
    };

    const handleChangeCheckbox = (contact: ContactEmail) => (event: ChangeEvent<HTMLInputElement>) => {
        const { checked } = event.target;
        let newValue: Recipient[];
        if (checked) {
            newValue = [...value, { Name: contact.Name, Address: contact.Email }];
        } else {
            newValue = value.filter((recipient) => recipient.Address !== contact.Email);
        }
        setValue(newValue);
    };

    const handleRemove = (toRemove: Recipient) => () => {
        setValue(value.filter((recipient) => recipient !== toRemove));
    };

    const isChecked = (contact: ContactEmail) => !!value.find((recipient) => recipient.Address === contact.Email);

    const handleSubmit = () => {
        onSubmit(value);
        onClose?.();
    };

    return (
        <FormModal
            submit={c('Action').t`Add`}
            title={c('Info').t`Add multiple recipients`}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <SearchInput placeholder={c('Info').t`Search for contacts`} onChange={handleChangeSearch} />
            <Table className="addresses-contacts-table">
                <TableHeader cells={[<Checkbox key={0} />, c('Info').t`Name`, c('Info').t`Email`]} />
                <TableBody colSpan={0}>
                    {contacts.map((contact) => (
                        <TableRow
                            key={contact.ID}
                            cells={[
                                <Checkbox
                                    key={0}
                                    checked={isChecked(contact)}
                                    onChange={handleChangeCheckbox(contact)}
                                />,
                                contact.Name,
                                contact.Email,
                            ]}
                        />
                    ))}
                </TableBody>
            </Table>
            {value.length > 0 && (
                <div className="composer-addresses-container flex-item-fluid pl1-25 pr1-25">
                    {value.map((recipient) => (
                        <AddressesRecipientItem
                            key={recipient.Address}
                            recipient={recipient}
                            messageSendInfo={messageSendInfo}
                            onRemove={handleRemove(recipient)}
                        />
                    ))}
                </div>
            )}
        </FormModal>
    );
};

export default AddressesContactsModal;
