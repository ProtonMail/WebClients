import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';

import { UpsellBookings } from '../../bookings/UpsellBookings';
import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import { BookingState } from '../../bookings/bookingsProvider/interface';
import { useBookingsAvailability } from '../../bookings/useBookingsAvailability';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
    disabled: boolean;
}

// TODO have an empty state placeholder
// TODO handle the state of the plus button
export const Bookings = ({ headerRef, disabled }: Props) => {
    const [displayBookings, setDisplayBookings] = useState(true);
    const [user] = useUser();
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const isBookingsAvailable = useBookingsAvailability();
    const { changeBookingState, canCreateBooking } = useBookings();

    if (!isBookingsAvailable) {
        return null;
    }

    const handleCreate = () => {
        if (user.hasPaidMail) {
            changeBookingState(BookingState.CREATE_NEW);
        } else {
            setModalOpen(true);
        }
    };

    return (
        <>
            <SidebarList>
                <SimpleSidebarListItemHeader
                    toggle={displayBookings}
                    onToggle={() => setDisplayBookings((prevState) => !prevState)}
                    text={c('Link').t`Bookings pages`}
                    testId="calendar-sidebar:bookings-pages-button"
                    headerRef={headerRef}
                    right={
                        <Tooltip title={c('Action').t`Create a new bookings page`}>
                            <button
                                type="button"
                                disabled={disabled || !canCreateBooking}
                                className="flex navigation-link-header-group-control shrink-0"
                                onClick={handleCreate}
                                data-testid="navigation-link:create-bookings-page"
                            >
                                <Icon name="plus" alt={c('Action').t`Create a new bookings page`} />
                            </button>
                        </Tooltip>
                    }
                    spaceAbove
                />
            </SidebarList>

            {renderModal && <UpsellBookings {...modalProps} />}
        </>
    );
};
