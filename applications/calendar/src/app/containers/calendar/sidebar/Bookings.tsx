import { useState } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';

import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import { useBookingsAvailability } from '../../bookings/useBookingsAvailability';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
}

// TODO have an empty state placeholder
// TODO handle the state of the plus button
export const Bookings = ({ headerRef }: Props) => {
    const [displayBookings, setDisplayBookings] = useState(true);

    const isBookingsAvailable = useBookingsAvailability();
    const { createNewBookingsPage } = useBookings();

    if (!isBookingsAvailable) {
        return null;
    }

    const handleCreate = () => {
        createNewBookingsPage();
    };

    return (
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
    );
};
