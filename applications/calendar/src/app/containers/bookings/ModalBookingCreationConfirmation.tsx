import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useNotifications } from '@proton/components/index';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import bookingImage from '@proton/styles/assets/img/calendar/booking_page_example.png';

interface Props extends ModalProps {
    bookingLink: string;
}

export const ModalBookingCreationConfirmation = ({ bookingLink, ...props }: Props) => {
    const { createNotification } = useNotifications();

    const handleCopyURLClick = () => {
        textToClipboard(bookingLink);
        createNotification({
            text: c('Success').t`Booking link copied to clipboard`,
        });
    };

    return (
        <Modal {...props}>
            <ModalHeader title={c('Title').t`Your booking page is ready`} />
            <ModalContent>
                <p>{c('Info').t`Share this page to let others book time in your calendar.`}</p>
                <div className="flex flex-nowrap gap-2 items-center justify-space-between mb-4">
                    <Href href={bookingLink} target="_blank" className="grow text-ellipsis" title={bookingLink}>
                        {bookingLink}
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
    );
};
