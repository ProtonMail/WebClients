import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef } from 'react';
import { useToggle, useContactEmails, useContactGroups } from 'react-components';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { noop } from 'proton-shared/lib/helpers/function';

import { MapSendInfo } from '../../../models/crypto';
import { MessageExtended } from '../../../models/message';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';
import { MessageChange } from '../Composer';

interface Props {
    message: MessageExtended;
    mapSendInfo: MapSendInfo;
    setMapSendInfo: Dispatch<SetStateAction<MapSendInfo>>;
    disabled: boolean;
    onChange: MessageChange;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const Addresses = ({
    message,
    mapSendInfo,
    setMapSendInfo,
    disabled,
    onChange,
    addressesBlurRef,
    addressesFocusRef
}: Props) => {
    const [contacts = [], loadingContacts] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const inputFocusRef = useRef<() => void>(noop);

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
            mapSendInfo={mapSendInfo}
            setMapSendInfo={setMapSendInfo}
            onChange={onChange}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            inputFocusRef={inputFocusRef}
        />
    ) : (
        <AddressesSummary
            message={message}
            mapSendInfo={mapSendInfo}
            contacts={contacts}
            contactGroups={contactGroups}
            onFocus={handleFocus}
        />
    );
};

export default Addresses;
