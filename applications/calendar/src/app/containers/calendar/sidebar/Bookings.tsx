import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { Spotlight, useLocalState } from '@proton/components';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import {
    IntroduceBookingsSpotlightContent,
    useIntroduceBookingsSpotlight,
} from '../../bookings/spotlight/IntroduceBookingsSpotlight';
import { BookingsLimitReached } from '../../bookings/upsells/BookingsLimitReached';
import { UpsellBookings } from '../../bookings/upsells/UpsellBookings';
import { useBookingUpsell } from '../../bookings/upsells/useBookingUpsell';
import { BookingItem } from './BookingsItem';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
    utcDate: Date;
    disabled: boolean;
}

export const Bookings = ({ headerRef, utcDate, disabled }: Props) => {
    const [user] = useUser();
    const [displayView, toggleView] = useLocalState(true, `${user.ID || 'item'}-display-views`);

    const { shouldShowLimitModal, loadingLimits } = useBookingUpsell();
    const [upsellModalProps, setUpsellModalOpen, renderUpsellModal] = useModalState();
    const [limitModalProps, setLimitModalOpen, renderLimitModal] = useModalState();

    const [calendars] = useCalendars();

    const [bookings] = useInternalBooking();

    const { openBookingSidebarCreation, canCreateBooking } = useBookings();

    const spotlight = useIntroduceBookingsSpotlight();

    const handleCreate = () => {
        spotlight.onClose();

        const userReachedBookingLimit = shouldShowLimitModal();
        if (userReachedBookingLimit.booking) {
            setLimitModalOpen(true);
        } else if (userReachedBookingLimit.plan) {
            if (user.canPay) {
                setUpsellModalOpen(true);
            } else {
                setLimitModalOpen(true);
            }
        } else {
            openBookingSidebarCreation(utcDate);
        }
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
                            toggle={displayView}
                            onToggle={(value) => toggleView(value)}
                            text={c('Link').t`Booking pages`}
                            testId="calendar-sidebar:bookings-pages-button"
                            headerRef={headerRef}
                            right={
                                <Tooltip title={c('Action').t`Create a new booking page`}>
                                    <button
                                        type="button"
                                        disabled={disabled || !canCreateBooking || loadingLimits}
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
                {displayView &&
                    bookings?.bookingPages.map((page, index) => (
                        <BookingItem
                            key={page.id}
                            page={page}
                            calendars={getVisualCalendars(calendars || [])}
                            canShowSpotlight={index === 0}
                        />
                    ))}
            </SidebarList>

            {renderUpsellModal && <UpsellBookings {...upsellModalProps} />}
            {renderLimitModal && <BookingsLimitReached {...limitModalProps} />}
        </>
    );
};
