import React, { MutableRefObject, useEffect, useRef, MouseEvent, useCallback } from 'react';
import { useToggle } from 'react-components';
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
    const toFocusRef = useRef<() => void>(noop);
    const ccFocusRef = useRef<() => void>(noop);

    const inputFocusRefs = {
        to: toFocusRef,
        cc: ccFocusRef,
    };

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

            setEditor(true);
            setExpanded(true);
            setTimeout(() => inputFocusRefs.cc.current(), 100);
        },
        [disabled]
    );

    return editor ? (
        <AddressesEditor
            message={message}
            messageSendInfo={messageSendInfo}
            onChange={onChange}
            expanded={expanded}
            toggleExpanded={handleToggleExpanded}
            inputFocusRefs={inputFocusRefs}
        />
    ) : (
        <AddressesSummary
            message={message.data}
            disabled={disabled}
            mapSendInfo={messageSendInfo.mapSendInfo}
            onFocus={handleFocus}
            toggleExpanded={handleToggleExpanded}
        />
    );
};

export default Addresses;
