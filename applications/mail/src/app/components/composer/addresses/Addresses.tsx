import React, { MutableRefObject, useEffect, useRef, MouseEvent } from 'react';
import { useToggle, useContactEmails, useContactGroups } from 'react-components';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { noop } from 'proton-shared/lib/helpers/function';

import { MessageExtended } from '../../../models/message';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';
import { MessageChange } from '../Composer';
import { MessageSendInfo } from '../../../hooks/useSendInfo';

interface Props {
    message: MessageExtended;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    onChange: MessageChange;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const Addresses = ({ message, messageSendInfo, disabled, onChange, addressesBlurRef, addressesFocusRef }: Props) => {
    const [contacts = [], loadingContacts] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const inputFocusRef = useRef<() => void>(noop);

    // Summary of selected addresses or addresses editor
    const { state: editor, set: setEditor } = useToggle(false);

    // CC and BCC visible in expanded mode
    const { state: expanded, set: setExpanded } = useToggle(false);

    useEffect(() => {
        addressesBlurRef.current = () => setEditor(false);
        addressesFocusRef.current = () => {
            setEditor(true);
            setTimeout(() => inputFocusRef.current());
        };
    }, []);

    if (loadingContacts || loadingContactGroups) {
        return null;
    }

    const handleFocus = () => {
        if (disabled) {
            return false;
        }

        setEditor(true);
        setExpanded(false);
        setTimeout(() => addressesFocusRef.current());
    };

    const handleToggleExpanded = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setEditor(true);
        setExpanded(true);
    };

    return editor ? (
        <AddressesEditor
            message={message}
            contacts={contacts}
            contactGroups={contactGroups}
            messageSendInfo={messageSendInfo}
            onChange={onChange}
            expanded={expanded}
            toggleExpanded={handleToggleExpanded}
            inputFocusRef={inputFocusRef}
        />
    ) : (
        <AddressesSummary
            message={message}
            messageSendInfo={messageSendInfo}
            contacts={contacts}
            contactGroups={contactGroups}
            onFocus={handleFocus}
            toggleExpanded={handleToggleExpanded}
        />
    );
};

export default Addresses;
