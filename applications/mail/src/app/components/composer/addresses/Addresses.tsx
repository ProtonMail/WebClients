import React, { Dispatch, MutableRefObject, SetStateAction, useState, useEffect, useRef } from 'react';
import { useToggle, useContactEmails, useContactGroups } from 'react-components';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { noop } from 'proton-shared/lib/helpers/function';
import { MapSendPreferences } from '../../../helpers/message/sendPreferences';

import { MessageExtended } from '../../../models/message';
import { MapStatusIcon } from '../../message/EncryptionStatusIcon';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';

interface Props {
    message: MessageExtended;
    mapSendPrefs: MapSendPreferences;
    setMapSendPrefs: Dispatch<SetStateAction<MapSendPreferences>>;
    disabled: boolean;
    onChange: (message: Partial<MessageExtended>) => void;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const Addresses = ({
    message,
    mapSendPrefs,
    setMapSendPrefs,
    disabled,
    onChange,
    addressesBlurRef,
    addressesFocusRef
}: Props) => {
    const [contacts = [], loadingContacts] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const inputFocusRef = useRef<() => void>(noop);
    const [mapSendIcons, setMapSendIcons] = useState<MapStatusIcon>({});

    // Summary of selected addresses or addresses editor
    const { state: editor, set: setEditor } = useToggle(false);

    // CC and BCC visible in expanded mode
    const { state: expanded, set: setExpanded, toggle: toggleExpanded } = useToggle(false);

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
        setExpanded(true);
        setTimeout(() => addressesFocusRef.current());
    };

    return editor ? (
        <AddressesEditor
            message={message}
            contacts={contacts}
            contactGroups={contactGroups}
            mapSendPrefs={mapSendPrefs}
            mapSendIcons={mapSendIcons}
            setMapSendPrefs={setMapSendPrefs}
            setMapSendIcons={setMapSendIcons}
            onChange={onChange}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            inputFocusRef={inputFocusRef}
        />
    ) : (
        <AddressesSummary
            message={message}
            mapSendIcons={mapSendIcons}
            contacts={contacts}
            contactGroups={contactGroups}
            onFocus={handleFocus}
        />
    );
};

export default Addresses;
