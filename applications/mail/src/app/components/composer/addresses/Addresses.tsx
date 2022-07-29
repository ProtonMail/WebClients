import { MouseEvent, MutableRefObject, useCallback, useEffect, useRef } from 'react';

import { ContactSelectorModal, useContactModals, useToggle } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { ContactSelectorProps } from '@proton/components/containers/contacts/selector/ContactSelectorModal';
import { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { RecipientType } from '../../../models/address';
import { MessageChange } from '../Composer';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';

interface Props {
    message: MessageState;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    onChange: MessageChange;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const Addresses = ({ message, messageSendInfo, disabled, onChange, addressesBlurRef, addressesFocusRef }: Props) => {
    const toFocusRef = useRef<() => void>(noop);
    const ccFocusRef = useRef<() => void>(noop);

    const inputFocusRefs = {
        to: toFocusRef,
        cc: ccFocusRef,
    };

    const { onEdit, onGroupDetails, modals: contactModals } = useContactModals({ onMailTo: noop });
    const [contactSelectorModal, showContactSelector] = useModalTwo<ContactSelectorProps, Recipient[]>(
        ContactSelectorModal
    );

    // Summary of selected addresses or addresses editor
    const { state: editor, set: setEditor } = useToggle(false);

    // CC and BCC visible in expanded mode
    const { state: expanded, set: setExpanded } = useToggle(false);

    useEffect(() => {
        addressesBlurRef.current = () => setEditor(false);
        addressesFocusRef.current = () => {
            if (message.data?.CCList.length || message.data?.BCCList.length) {
                setExpanded(true);
            }
            setEditor(true);
            setTimeout(() => inputFocusRefs.to.current(), 100);
        };
    }, [message.data?.CCList, message.data?.BCCList]);

    const handleFocus = useCallback(() => {
        if (disabled) {
            return false;
        }

        setEditor(true);
        setExpanded(false);
        setTimeout(() => addressesFocusRef.current(), 100);
    }, [disabled]);

    const handleToggleExpanded = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();

            if (disabled) {
                return false;
            }

            // If click on the CC, BCC button and is already opened, we close the "expanded"
            if (editor && expanded) {
                setExpanded(false);
                setTimeout(() => inputFocusRefs.to.current(), 100);
            } else {
                setEditor(true);
                setExpanded(true);
                setTimeout(() => inputFocusRefs.cc.current(), 100);
            }
        },
        [disabled, expanded, editor]
    );

    const handleContactModal = (type: RecipientType) => async () => {
        const recipients = await showContactSelector({
            inputValue: message.data?.[type],
            onGroupDetails,
            onEdit,
        });

        const currentRecipients = message.data && message.data[type] ? message.data[type] : [];
        // the contacts being handled in the modal
        const currentNonContacts = currentRecipients.filter((r) => !r.ContactID);

        onChange({ data: { [type]: [...currentNonContacts, ...recipients] } });
    };

    return (
        <>
            {editor ? (
                <AddressesEditor
                    message={message}
                    messageSendInfo={messageSendInfo}
                    onChange={onChange}
                    expanded={expanded}
                    toggleExpanded={handleToggleExpanded}
                    inputFocusRefs={inputFocusRefs}
                    handleContactModal={handleContactModal}
                />
            ) : (
                <AddressesSummary
                    message={message.data}
                    disabled={disabled}
                    mapSendInfo={messageSendInfo.mapSendInfo}
                    onFocus={handleFocus}
                    toggleExpanded={handleToggleExpanded}
                    handleContactModal={handleContactModal}
                />
            )}
            {contactSelectorModal}
            {contactModals}
        </>
    );
};

export default Addresses;
