import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';

import { UpsellBookings } from './UpsellBookings';
import { useBookings } from './bookingsProvider/BookingsProvider';
import { BookingState } from './bookingsProvider/interface';

interface Props {
    onCreateEvent?: () => void;
    disabled?: boolean;
}

export const BookingSidebarAction = ({ onCreateEvent, disabled }: Props) => {
    const [user] = useUser();
    const { changeBookingState } = useBookings();

    const [modalProps, setModalOpen, renderModal] = useModalState();

    const handleBookingPage = () => {
        if (!user.hasPaidMail) {
            setModalOpen(true);
            return;
        }

        changeBookingState(BookingState.CREATE_NEW);
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
            >
                <DropdownMenu className="my-2">
                    <DropdownMenuButton onClick={onCreateEvent}>
                        <div className="flex gap-2 items-center">
                            <Icon name="calendar-day" />
                            {c('Action').t`Create an event`}
                        </div>
                    </DropdownMenuButton>
                    <DropdownMenuButton onClick={handleBookingPage}>
                        <div className="flex gap-8 items-center">
                            <div className="flex gap-2 items-center">
                                <Icon name="calendar-checkmark" />
                                {c('Action').t`Create a booking page`}
                            </div>
                            {user.hasPaidMail ? null : <Icon className="color-hint" name="upgrade" />}
                        </div>
                    </DropdownMenuButton>
                </DropdownMenu>
            </SimpleDropdown>
            {renderModal && <UpsellBookings {...modalProps} />}
        </>
    );
};
