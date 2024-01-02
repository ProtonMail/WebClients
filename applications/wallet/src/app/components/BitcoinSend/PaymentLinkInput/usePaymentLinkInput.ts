import { useCallback, useEffect, useState } from 'react';

import { useDebounceInput } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';

import { WasmError, WasmNetwork, WasmPaymentLink } from '../../../../pkg';
import { getHumanReadableErrorFromWasmError, tryHandleWasmError } from '../../../utils';

export const usePaymentLinkInput = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [parsedPaymentLink, setParsedPaymentLink] = useState<WasmPaymentLink>();
    const closeModal = useCallback(() => setIsOpen(false), []);
    const openModal = useCallback(() => setIsOpen(true), []);

    const { createNotification } = useNotifications();

    const [paymentLinkInput, setPaymentLinkInput] = useState('');
    const debouncedPaymentLinkInput = useDebounceInput(paymentLinkInput, 1 * SECOND);

    const handleScanQrCode = useCallback(
        (qrcode) => {
            setPaymentLinkInput(qrcode.data);
            closeModal();
        },
        [closeModal]
    );

    const handleClickPasteButton = useCallback(() => {
        void navigator.clipboard.readText().then((text) => {
            setPaymentLinkInput(text);
        });
    }, []);

    const handleTextAreaInputChange = useCallback((value: string) => {
        setPaymentLinkInput(value);
    }, []);

    useEffect(() => {
        if (!debouncedPaymentLinkInput) {
            return;
        }

        try {
            const parsedPaymentLink = WasmPaymentLink.tryParse(debouncedPaymentLinkInput, WasmNetwork.Testnet);
            setParsedPaymentLink(parsedPaymentLink);
        } catch (error) {
            setParsedPaymentLink(undefined);
            createNotification({
                text: tryHandleWasmError(error) ?? getHumanReadableErrorFromWasmError(WasmError.InvalidAddress),
            });
        }
    }, [createNotification, debouncedPaymentLinkInput]);

    return {
        isOpen,
        closeModal,
        openModal,

        paymentLinkInput,
        parsedPaymentLink,
        handleScanQrCode,
        handleClickPasteButton,
        handleTextAreaInputChange,
    };
};
