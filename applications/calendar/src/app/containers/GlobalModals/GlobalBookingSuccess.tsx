import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import bookingImage from '@proton/styles/assets/img/calendar/booking_page_example.png';

import { useCalendarGlobalModals } from './GlobalModalProvider';
import { type BookingPageCreationModalPayload, ModalType } from './interface';

export const GlobalBookingSuccess = () => {
    const { subscribe } = useCalendarGlobalModals();
    const { createNotification } = useNotifications();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [bookingPageCreationProps, setBookingPageCreationProps] = useState<
        BookingPageCreationModalPayload['value'] | null
    >(null);

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.BookingPageCreation) {
                setOpen(true);
                setBookingPageCreationProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe, setOpen]);

    const handleConfirm = () => {
        bookingPageCreationProps?.onConfirm();

        setOpen(false);
        setBookingPageCreationProps(null);
    };

    const handleCopyURLClick = () => {
        textToClipboard(bookingPageCreationProps?.bookingLink);
        createNotification({
            text: c('Success').t`Booking link copied to clipboard`,
        });
    };

    return (
        <>
            {shouldRender && bookingPageCreationProps && (
                <Modal
                    {...modalProps}
                    onClose={() => {
                        handleConfirm();
                    }}
                >
                    <ModalHeader title={c('Title').t`Your booking page is ready`} />
                    <ModalContent>
                        <p>{c('Info').t`Share this page to let others book time in your calendar.`}</p>
                        <div className="flex flex-nowrap gap-2 items-center justify-space-between mb-4">
                            <Href
                                href={bookingPageCreationProps.bookingLink}
                                target="_blank"
                                className="grow text-ellipsis"
                                title={bookingPageCreationProps.bookingLink}
                            >
                                {bookingPageCreationProps.bookingLink}
                            </Href>
                            <Button icon size="small" className="shrink-0" onClick={handleCopyURLClick}>
                                <Icon name="squares" alt={c('Action').t`Copy Booking link`} />
                            </Button>
                        </div>
                        <div className="border rounded-lg pt-3 px-3">
                            <img height={242} width={391} src={bookingImage} alt={c('Info').t`Booking page example`} />
                        </div>
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};
