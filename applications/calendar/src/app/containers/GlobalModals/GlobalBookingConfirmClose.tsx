import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

import { useCalendarGlobalModals } from './GlobalModalProvider';
import { type BookingPageConfirmCloseModalPayload, ModalType } from './interface';

export const GlobalBookingConfirmClose = () => {
    const { subscribe } = useCalendarGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [bookingPageCreationProps, setBookingPageCreationProps] = useState<
        BookingPageConfirmCloseModalPayload['value'] | null
    >(null);

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.BookingPageConfirmClose) {
                setOpen(true);
                setBookingPageCreationProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe, setOpen]);

    const handleClose = () => {
        bookingPageCreationProps?.onClose();

        setOpen(false);
        setBookingPageCreationProps(null);
    };

    if (!bookingPageCreationProps) {
        return null;
    }

    return (
        <>
            {shouldRender && (
                <Prompt
                    title={c('Title').t`Discard changes?`}
                    buttons={[
                        <Button
                            color="danger"
                            onClick={() => {
                                handleClose();
                            }}
                        >
                            {c('Action').t`Discard`}
                        </Button>,
                        <Button onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...modalProps}
                >
                    <p className="m-0">{c('Info').t`You will loose all unsaved changes.`}</p>
                </Prompt>
            )}
        </>
    );
};
