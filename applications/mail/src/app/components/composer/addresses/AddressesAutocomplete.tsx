import React, { useState, useMemo, useEffect, MutableRefObject, useRef, ReactNode } from 'react';
import Awesomplete from 'awesomplete';
import { toMap } from 'proton-shared/lib/helpers/object';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import { contactToInput } from '../../../helpers/addresses';
import { ContactEmail, ContactGroup, ContactOrGroup } from 'proton-shared/lib/interfaces/contacts';
import { useEventListener } from '../../../hooks/useHandler';

interface Props {
    inputRef: MutableRefObject<HTMLInputElement | null>;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    majorDomains: string[];
    children: ReactNode;
    onSelect: (value: ContactOrGroup) => void;
    currentValue: Recipient[];
    autoComplete?: string;
}

const AddressesAutocomplete = ({
    inputRef,
    autoComplete,
    contacts,
    contactGroups,
    majorDomains,
    onSelect,
    currentValue,
    children
}: Props) => {
    const [awesomplete, setAwesomplete] = useState<Awesomplete>();
    const containerRef = useRef<HTMLDivElement>(null);
    const contactEmailsMap = useMemo(() => toMap(contacts, 'Email'), [contacts]);
    const recipientAddressesMap = useMemo(() => toMap(currentValue, 'Address'), [currentValue]);
    const recipientGroupsMap = useMemo(() => toMap(currentValue, 'Group'), [currentValue]);

    useEffect(() => {
        const awesompleteInstance = new Awesomplete(
            inputRef.current as HTMLElement,
            {
                container: () => containerRef.current as HTMLElement,
                minChars: 1,
                maxItems: Infinity,
                autoFirst: true,
                sort: false
            } as Awesomplete.Options
        );
        setAwesomplete(awesompleteInstance);

        if (autoComplete) {
            inputRef.current?.setAttribute('autocomplete', autoComplete);
        }

        return () => awesompleteInstance.destroy();
    }, []);

    useEffect(() => {
        if (awesomplete) {
            const contactList = contacts
                .filter((contact) => !recipientAddressesMap[contact.Email])
                .map((contact) => ({
                    label: contactToInput(contact),
                    value: `Contact:${contact.ID}`
                }));

            const groupList = contactGroups
                .filter((group) => !recipientGroupsMap[group.Path])
                .map((group) => ({
                    label: group.Name,
                    value: `Group:${group.ID}`
                }));

            const majorList = majorDomains
                .filter((email) => !recipientAddressesMap[email] && !contactEmailsMap[email])
                .map((email) => ({
                    label: email,
                    value: `Major:${email}`
                }));

            awesomplete.list = [...contactList, ...groupList, ...majorList];

            (awesomplete as any).item = (text: string, input: string, itemId: string) =>
                (Awesomplete.ITEM as any)(text.replace('<', '&lt;'), input, itemId);
        }
    }, [awesomplete, contacts, contactGroups, majorDomains, currentValue]);

    useEffect(() => {
        if (awesomplete) {
            // Prevent Awesomplete to open immediately
            awesomplete.close();
        }
    }, [awesomplete]);

    const handleSelect = (event: any) => {
        const value = event.text.value;
        const contactID = /Contact:(.*)/.exec(value)?.[1];
        const contact = contacts.find((contact) => contact.ID === contactID);
        const groupID = /Group:(.*)/.exec(value)?.[1];
        const group = contactGroups.find((group) => group.ID === groupID);
        const major = /Major:(.*)/.exec(value)?.[1];
        if (contact || group || major) {
            onSelect({ contact, group, major });
        }
        awesomplete?.close();
    };

    useEventListener(inputRef, 'awesomplete-selectcomplete', handleSelect);

    return (
        <div className="composer-addresses-autocomplete w100 flex-item-fluid relative" ref={containerRef}>
            {children}
        </div>
    );
};

export default AddressesAutocomplete;
