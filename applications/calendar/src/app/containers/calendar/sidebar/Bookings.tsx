import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import { UpsellBookings } from '../../bookings/UpsellBookings';
import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import { useBookingsAvailability } from '../../bookings/useBookingsAvailability';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
    utcDate: Date;
    disabled: boolean;
}

// TODO have an empty state placeholder
export const Bookings = ({ headerRef, utcDate, disabled }: Props) => {
    const [displayBookings, setDisplayBookings] = useState(true);
    const [user] = useUser();
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const isBookingsAvailable = useBookingsAvailability();
    const { openBookingSidebar, canCreateBooking } = useBookings();

    if (!isBookingsAvailable) {
        return null;
    }

    const handleCreate = () => {
        if (user.hasPaidMail) {
            openBookingSidebar(utcDate);
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
                                <IcPlus alt={c('Action').t`Create a new bookings page`} />
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
