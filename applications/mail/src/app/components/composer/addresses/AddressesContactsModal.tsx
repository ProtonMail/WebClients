import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import {
    Table,
    TableHeader,
    Checkbox,
    TableRow,
    TableBody,
    FormModal,
    SearchInput as SearchInputUntyped
} from 'react-components';
import { ContactEmail } from '../../../models/contact';
import AddressesRecipientItem from './AddressesRecipientItem';
import { Recipient } from '../../../models/address';

const SearchInput = SearchInputUntyped as any;

interface Props {
    inputValue?: Recipient[];
    allContacts?: ContactEmail[];
    onClose?: () => void;
    onSubmit: (recipients: Recipient[]) => void;
}

const AddressesContactsModal = ({ onSubmit, onClose, inputValue = [], allContacts = [], ...rest }: Props) => {
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
        const checked = event.target.checked;
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
                                contact.Email
                            ]}
                        />
                    ))}
                </TableBody>
            </Table>
            {value.length > 0 && (
                <div className="composer-addresses-container flex-item-fluid bordered-container pl1-25 pr1-25">
                    {value.map((recipient, i) => (
                        <AddressesRecipientItem key={i} recipient={recipient} onRemove={handleRemove(recipient)} />
                    ))}
                </div>
            )}
        </FormModal>
    );
};

export default AddressesContactsModal;
