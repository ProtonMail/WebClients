import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';

import { useBookings } from './bookingsProvider/BookingsProvider';
import { BookingState } from './bookingsProvider/interface';

interface Props {
    onCreateEvent?: () => void;
}

export const BookingSidebarAction = ({ onCreateEvent }: Props) => {
    const [user] = useUser();
    const { changeBookingState } = useBookings();

    const handleBookingPage = () => {
        if (!user.hasPaidMail) {
            // TODO show upsell
        }

        changeBookingState(BookingState.CREATE_NEW);
    };

    return (
        <SimpleDropdown as={Button} size="large" color="norm" icon group>
            <DropdownMenu>
                <DropdownMenuButton onClick={onCreateEvent}>
                    <div className="flex gap-2 items-center">
                        <Icon name="calendar-day" />
                        {c('Action').t`Create an event`}
                    </div>
                </DropdownMenuButton>
                <DropdownMenuButton onClick={handleBookingPage}>
                    <div className="flex gap-2 items-center">
                        <Icon name="calendar-checkmark" />
                        {c('Action').t`Create a booking page`}
                    </div>
                </DropdownMenuButton>
            </DropdownMenu>
        </SimpleDropdown>
    );
};
