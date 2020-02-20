import React, { MutableRefObject, useEffect } from 'react';
import { useToggle, useContactEmails } from 'react-components';

import { MessageExtended } from '../../../models/message';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';
import { getRecipients } from '../../../helpers/message/messages';
import { ContactEmail } from '../../../models/contact';
import { useContactGroups } from '../../../hooks/useContactGroups';

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const Addresses = ({ message, onChange, addressesBlurRef, addressesFocusRef }: Props) => {
    const [contacts, loadingContacts] = useContactEmails() as [ContactEmail[], boolean, Error];
    const [contactGroups, loadingContactGroups] = useContactGroups();

    // Summary of selected addresses or addresses editor
    const { state: editor, set: setEditor } = useToggle(true);

    // CC and BCC visible in expanded mode
    const { state: expanded, set: setExpanded, toggle: toggleExpanded } = useToggle(
        getRecipients(message.data).length > 0
    );

    useEffect(() => {
        addressesBlurRef.current = () => setEditor(false);
    }, []);

    if (loadingContacts || loadingContactGroups) {
        return null;
    }

    const handleFocus = () => {
        setEditor(true);
        setExpanded(true);
        setTimeout(() => {
            addressesFocusRef.current();
        });
    };

    return editor ? (
        <AddressesEditor
            message={message}
            contacts={contacts}
            contactGroups={contactGroups}
            onChange={onChange}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            addressesFocusRef={addressesFocusRef}
        />
    ) : (
        <AddressesSummary message={message} contacts={contacts} contactGroups={contactGroups} onFocus={handleFocus} />
    );
};

export default Addresses;
