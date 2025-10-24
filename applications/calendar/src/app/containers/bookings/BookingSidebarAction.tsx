import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { UpsellModal, useModalState } from '@proton/components';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import bookingImg from '@proton/styles/assets/img/illustrations/new-upsells-img/booking_page.svg';

import { useBookings } from './bookingsProvider/BookingsProvider';
import { BookingState } from './bookingsProvider/interface';

interface Props {
    onCreateEvent?: () => void;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: CALENDAR_UPSELL_PATHS.BOOKING_PAGE,
});

export const BookingSidebarAction = ({ onCreateEvent }: Props) => {
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
            <SimpleDropdown as={Button} size="large" originalPlacement="bottom-end" color="norm" icon group>
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
            {renderModal && (
                <UpsellModal
                    title={c('Title').t`Ready to automate your scheduling?`}
                    description={c('Info')
                        .t`Let others book time with you automatically. No back-and-forth emails. Share a link, and stay in control of your availability.`}
                    modalProps={modalProps}
                    illustration={bookingImg}
                    upsellRef={upsellRef}
                />
            )}
        </>
    );
};
