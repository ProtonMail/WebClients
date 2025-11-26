import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcCalendarDay } from '@proton/icons/icons/IcCalendarDay';
import { IcCalendarListCheck } from '@proton/icons/icons/IcCalendarListCheck';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';

import { useBookings } from './bookingsProvider/BookingsProvider';
import { UpsellBookings } from './upsells/UpsellBookings';

import './BookingSidebarAction.scss';

interface Props {
    onCreateEvent?: () => void;
    disabled?: boolean;
    utcDate: Date;
}

export const BookingSidebarAction = ({ onCreateEvent, disabled, utcDate }: Props) => {
    const [user] = useUser();
    const { openBookingSidebarCreation, canCreateBooking } = useBookings();

    const [modalProps, setModalOpen, renderModal] = useModalState();

    const handleBookingPage = () => {
        if (!user.hasPaidMail) {
            setModalOpen(true);
            return;
        }

        openBookingSidebarCreation(utcDate);
    };

    return (
        <>
            <SimpleDropdown
                disabled={disabled}
                as={Button}
                size="large"
                originalPlacement="bottom-end"
                color="norm"
                icon
                group
                className="booking-main-dropdown flex items-center justify-center"
                caretAlt={c('Action').t`More options`}
            >
                <DropdownMenu className="my-2">
                    <DropdownMenuButton onClick={onCreateEvent}>
                        <div className="flex gap-2 items-center">
                            <IcCalendarDay />
                            {c('Action').t`Create an event`}
                        </div>
                    </DropdownMenuButton>
                    <DropdownMenuButton onClick={handleBookingPage} disabled={!canCreateBooking}>
                        <div className="flex gap-8 items-center">
                            <div className="flex gap-2 items-center">
                                <IcCalendarListCheck />
                                {c('Action').t`Create a booking page`}
                            </div>
                            {user.hasPaidMail ? null : <IcUpgrade className="color-hint" name="upgrade" />}
                        </div>
                    </DropdownMenuButton>
                </DropdownMenu>
            </SimpleDropdown>
            {renderModal && <UpsellBookings {...modalProps} />}
        </>
    );
};
