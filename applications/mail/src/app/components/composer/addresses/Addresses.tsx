import { MouseEvent, MutableRefObject, useEffect, useRef, useState } from 'react';

import { ContactSelectorModal, useContactModals, useToggle } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { ContactSelectorProps } from '@proton/components/containers/contacts/selector/ContactSelectorModal';
import { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { selectComposer } from '../../../logic/composers/composerSelectors';
import { composerActions } from '../../../logic/composers/composersSlice';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { useAppDispatch, useAppSelector } from '../../../logic/store';
import { RecipientType } from '../../../models/address';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';

interface Props {
    message: MessageState;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
    composerID: string;
}

const Addresses = ({ messageSendInfo, disabled, addressesBlurRef, addressesFocusRef, composerID }: Props) => {
    const toFocusRef = useRef<() => void>(noop);
    const ccFocusRef = useRef<() => void>(noop);
    const bccFocusRef = useRef<() => void>(noop);
    const composer = useAppSelector((store) => selectComposer(store, composerID));
    const dispatch = useAppDispatch();

    const inputFocusRefs = {
        to: toFocusRef,
        cc: ccFocusRef,
        bcc: bccFocusRef,
    };

    const { onEdit, onGroupDetails, modals: contactModals } = useContactModals({ onMailTo: noop });
    const [contactSelectorModal, showContactSelector] = useModalTwo<ContactSelectorProps, Recipient[]>(
        ContactSelectorModal
    );

    // Summary of selected addresses or addresses editor
    const { state: editor, set: setEditor } = useToggle(false);
    const [ccExpanded, setCCExpanded] = useState(false);
    const [bccExpanded, setBCCExpanded] = useState(false);

    useEffect(() => {
        addressesBlurRef.current = () => {
            setEditor(false);
            setCCExpanded(false);
            setBCCExpanded(false);
        };
        addressesFocusRef.current = () => {
            if (composer.recipients.CCList.length) {
                setCCExpanded(true);
            }
            if (composer.recipients.BCCList.length) {
                setBCCExpanded(true);
            }
            setEditor(true);
            setTimeout(() => inputFocusRefs.to.current(), 100);
        };
    }, [composer.recipients.CCList, composer.recipients.BCCList]);

    const handleFocus = () => {
        if (disabled) {
            return false;
        }

        setEditor(true);
        setCCExpanded(false);
        setBCCExpanded(false);
        setTimeout(() => addressesFocusRef.current(), 100);
    };

    const handleDisplayFocusFields = (type: RecipientType) => {
        if (disabled) {
            return false;
        }
        setEditor(true);
        if (type === 'CCList' || composer.recipients.CCList.length) {
            setCCExpanded(true);
        }
        if (type === 'BCCList' || composer.recipients.BCCList.length) {
            setBCCExpanded(true);
        }
        setTimeout(() => {
            if (type === 'ToList') {
                inputFocusRefs.to.current();
            }
            if (type === 'CCList') {
                inputFocusRefs.cc.current();
            }
            if (type === 'BCCList') {
                inputFocusRefs.bcc.current();
            }
        }, 100);
    };

    const handleToggleClick = (type: RecipientType) => (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handleDisplayFocusFields(type);
    };

    const handleContactModal = (type: RecipientType) => async () => {
        const recipients = await showContactSelector({
            inputValue: composer.recipients?.[type],
            onGroupDetails,
            onEdit,
        });

        const currentRecipients = composer.recipients && composer.recipients[type] ? composer.recipients[type] : [];
        // the contacts being handled in the modal
        const currentNonContacts = currentRecipients.filter((r) => !r.ContactID);

        dispatch(
            composerActions.setRecipients({ ID: composerID, type, recipients: [...currentNonContacts, ...recipients] })
        );
        handleDisplayFocusFields(type);
    };

    return (
        <>
            {editor ? (
                <AddressesEditor
                    composerID={composerID}
                    messageSendInfo={messageSendInfo}
                    inputFocusRefs={inputFocusRefs}
                    handleContactModal={handleContactModal}
                    ccExpanded={ccExpanded}
                    bccExpanded={bccExpanded}
                    toggleExpanded={handleToggleClick}
                />
            ) : (
                <AddressesSummary
                    composerID={composerID}
                    disabled={disabled}
                    mapSendInfo={messageSendInfo.mapSendInfo}
                    onFocus={handleFocus}
                    toggleExpanded={handleToggleClick}
                    handleContactModal={handleContactModal}
                />
            )}
            {contactSelectorModal}
            {contactModals}
        </>
    );
};

export default Addresses;
