import React, { useState, useMemo, useEffect, MutableRefObject, useRef, ReactNode } from 'react';
import Awesomplete from 'awesomplete';
import { useEventListener, useAutocompleteRecipient } from 'react-components';
import { toMap } from 'proton-shared/lib/helpers/object';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { ContactEmail, ContactGroup, ContactOrGroup } from 'proton-shared/lib/interfaces/contacts';

import { contactToInput } from '../../../helpers/addresses';

const compareFunction = (
    item1: { label: string; value: string; score?: number },
    item2: { label: string; value: string; score?: number }
) => {
    if (item1.score !== item2.score) {
        return (item2.score || 0) - (item1.score || 0);
    }

    if (item1.label > item2.label) {
        return 1;
    }

    if (item1.label < item2.label) {
        return -1;
    }

    return 0;
};

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
    children,
}: Props) => {
    const [awesomplete, setAwesomplete] = useState<Awesomplete>();
    const containerRef = useRef<HTMLDivElement>(null);
    const contactEmailsMap = useMemo(() => toMap(contacts, 'Email'), [contacts]);
    const recipientAddressesMap = useMemo(() => toMap(currentValue, 'Address'), [currentValue]);
    const recipientGroupsMap = useMemo(() => toMap(currentValue, 'Group'), [currentValue]);
    const contactList = useMemo(
        () =>
            contacts
                .filter((contact) => !recipientAddressesMap[contact.Email])
                .map((contact) => ({
                    label: contactToInput(contact),
                    value: `Contact:${contact.ID}`,
                    score: ((contact as any).LastUsedTime as number | undefined) || 0,
                }))
                .sort(compareFunction),
        [recipientAddressesMap, contacts]
    );
    const groupList = useMemo(
        () =>
            contactGroups
                .filter((group) => !recipientGroupsMap[group.Path])
                .map((group) => ({
                    label: group.Name,
                    value: `Group:${group.ID}`,
                }))
                .sort(compareFunction),
        [recipientGroupsMap, contactGroups]
    );
    const majorList = useMemo(
        () =>
            majorDomains
                .filter((email) => !recipientAddressesMap[email] && !contactEmailsMap[email])
                .map((email) => ({
                    label: email,
                    value: `Major:${email}`,
                })),
        [majorDomains, recipientAddressesMap, contactEmailsMap]
    );
    const recipientItem = useAutocompleteRecipient();

    // Init Awesomplete
    useEffect(() => {
        const awesompleteInstance = new Awesomplete(
            inputRef.current as HTMLElement,
            {
                container: () => containerRef.current as HTMLElement,
                minChars: 1,
                maxItems: 20,
                autoFirst: true,
                sort: false,
            } as Awesomplete.Options
        );
        (awesompleteInstance as any).item = recipientItem;
        setAwesomplete(awesompleteInstance);

        if (autoComplete) {
            inputRef.current?.setAttribute('autocomplete', autoComplete);
        }

        return () => awesompleteInstance.destroy();
    }, []);

    // Update list
    useEffect(() => {
        if (awesomplete) {
            awesomplete.list = [...contactList, ...groupList, ...majorList];
        }
    }, [awesomplete, contactList, groupList, majorList]);

    useEffect(() => {
        if (awesomplete) {
            // Prevent Awesomplete to open immediately
            awesomplete.close();
        }
    }, [awesomplete]);

    const handleSelect = (event: any) => {
        const { value } = event.text;
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
