import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useLocalState from '@proton/components/hooks/useLocalState';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import {
    IntroduceBookingsSpotlightContent,
    useIntroduceBookingsSpotlight,
} from '../../bookings/spotlight/IntroduceBookingsSpotlight';
import { BookingItem } from './BookingsItem';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
    utcDate: Date;
    disabled: boolean;
}

export const Bookings = ({ headerRef, utcDate, disabled }: Props) => {
    const [user] = useUser();
    const [displayBookings, toggleBookings] = useLocalState(true, `${user.ID || 'item'}-display-bookings`);

    const [calendars] = useCalendars();

    const [bookings] = useInternalBooking();

    const { openBookingSidebarCreation, canCreateBooking } = useBookings();

    const spotlight = useIntroduceBookingsSpotlight();

    const handleCreate = () => {
        spotlight.onClose();
        openBookingSidebarCreation(utcDate);
    };

    return (
        <>
            <SidebarList>
                <Spotlight
                    originalPlacement="right"
                    closeIcon="cross-big"
                    content={<IntroduceBookingsSpotlightContent />}
                    show={spotlight.shouldShowSpotlight}
                    onDisplayed={spotlight.onDisplayed}
                    onClose={spotlight.onClose}
                >
                    {/* The div can be removed when the spotligh is removed */}
                    <div>
                        <SimpleSidebarListItemHeader
                            toggle={displayBookings}
                            onToggle={toggleBookings}
                            text={c('Link').t`Booking pages`}
                            testId="calendar-sidebar:bookings-pages-button"
                            headerRef={headerRef}
                            right={
                                <Tooltip title={c('Action').t`Create a new booking page`}>
                                    <button
                                        type="button"
                                        disabled={disabled || !canCreateBooking}
                                        className="flex navigation-link-header-group-control shrink-0"
                                        onClick={handleCreate}
                                        data-testid="navigation-link:create-bookings-page"
                                    >
                                        <IcPlus alt={c('Action').t`Create a new booking page`} />
                                    </button>
                                </Tooltip>
                            }
                        />
                    </div>
                </Spotlight>
                {displayBookings &&
                    bookings?.bookingPages.map((page, index) => (
                        <BookingItem
                            key={page.id}
                            page={page}
                            calendars={getVisualCalendars(calendars || [])}
                            canShowSpotlight={index === 0}
                        />
                    ))}
            </SidebarList>
        </>
    );
};
