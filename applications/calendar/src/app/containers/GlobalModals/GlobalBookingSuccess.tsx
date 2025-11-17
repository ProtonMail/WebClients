import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import useNotifications from '@proton/components/hooks/useNotifications';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
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

    const handleClose = () => {
        bookingPageCreationProps?.onClose();

        setOpen(false);
        setBookingPageCreationProps(null);
    };

    const handleCopyURLClick = () => {
        textToClipboard(bookingPageCreationProps?.bookingLink);
        createNotification({
            text: c('Success').t`Booking link copied to clipboard`,
        });
    };

    if (!bookingPageCreationProps) {
        return null;
    }

    // Clicking the link on the desktop app should open the browser and not load the page.
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isElectronMail) {
            e.preventDefault();
            openLinkInBrowser(bookingPageCreationProps.bookingLink);
        }
    };

    return (
        <>
            {shouldRender && (
                <Modal
                    {...modalProps}
                    onClose={() => {
                        handleClose();
                    }}
                    size="xsmall"
                    className="px-6 pb-8 pt-4"
                >
                    <ModalHeader />
                    <ModalContent className="m-0">
                        <h2 className="mb-2 text-bold text-center text-lg">{c('Title')
                            .t`Your booking page is ready`}</h2>
                        <p className="color-weak m-0 mb-6 text-wrap-balance text-center">{c('Info')
                            .t`Share this page to let others book time in your calendar. You can find and edit it in the sidebar under Booking pages.`}</p>
                        <img
                            className="mb-6 rounded-xl"
                            height={195}
                            width={310}
                            src={bookingImage}
                            alt={c('Info').t`Booking page example`}
                        />
                        <div className="mb-6 w-9/10 mx-auto justify-center text-ellipsis">
                            <Href
                                href={bookingPageCreationProps.bookingLink}
                                onClick={handleLinkClick}
                                target="_blank"
                                title={bookingPageCreationProps.bookingLink}
                            >
                                {bookingPageCreationProps.bookingLink}
                            </Href>
                        </div>

                        <Button
                            fullWidth
                            onClick={() => {
                                handleCopyURLClick();
                                handleClose();
                            }}
                        >{c('Action').t`Copy link and close`}</Button>
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};
