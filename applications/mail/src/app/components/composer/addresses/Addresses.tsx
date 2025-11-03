import type { MouseEvent, MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { ContactSelectorModal, useContactModals, useToggle } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import noop from '@proton/utils/noop';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import type { MessageSendInfo } from '../../../hooks/useSendInfo';
import type { RecipientType } from '../../../models/address';
import { selectComposer } from '../../../store/composers/composerSelectors';
import { composerActions } from '../../../store/composers/composersSlice';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';

interface Props {
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
    const composer = useMailSelector((store) => selectComposer(store, composerID));
    const dispatch = useMailDispatch();

    const inputFocusRefs = {
        to: toFocusRef,
        cc: ccFocusRef,
        bcc: bccFocusRef,
    };

    const { onEdit, onGroupDetails, modals: contactModals } = useContactModals({ onMailTo: noop });
    const [contactSelectorModal, showContactSelector] = useModalTwo(ContactSelectorModal);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-5D91B1
    }, [composer?.recipients?.CCList, composer?.recipients?.BCCList]);

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
