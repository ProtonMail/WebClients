import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import { useLocalState } from '@proton/components/index';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { UpsellBookings } from '../../bookings/UpsellBookings';
import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import { BookingItem } from './BookingsItem';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
    utcDate: Date;
    disabled: boolean;
}

export const Bookings = ({ headerRef, utcDate, disabled }: Props) => {
    const [user] = useUser();
    const [displayView, toggleView] = useLocalState(true, `${user.ID || 'item'}-display-views`);
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const [writeableCalendars] = useWriteableCalendars();

    const [bookings] = useInternalBooking();

    const { openBookingSidebar, canCreateBooking } = useBookings();

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
                    toggle={displayView}
                    onToggle={(value) => toggleView(value)}
                    text={c('Link').t`Booking pages`}
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
                />
                {displayView &&
                    bookings?.bookingPages.map((page) => (
                        <BookingItem key={page.id} page={page} writeableCalendars={writeableCalendars} />
                    ))}
            </SidebarList>

            {renderModal && <UpsellBookings {...modalProps} />}
        </>
    );
};
