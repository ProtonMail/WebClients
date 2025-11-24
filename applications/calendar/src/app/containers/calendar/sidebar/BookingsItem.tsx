import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import SidebarListItem from '@proton/components/components/sidebar/SidebarListItem';
import SidebarListItemContent from '@proton/components/components/sidebar/SidebarListItemContent';
import SidebarListItemLabel from '@proton/components/components/sidebar/SidebarListItemLabel';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCalendarListFilled } from '@proton/icons/icons/IcCalendarListFilled';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';

import { useCalendarDispatch } from '../../../store/hooks';
import type { BookingPageEditData, InternalBookingPage } from '../../../store/internalBooking/interface';
import { loadBookingPage } from '../../../store/internalBooking/internalBookingActions';
import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import {
    BookingPageLocationSpotlightContent,
    useBookingPageLocationSpotlight,
} from '../../bookings/spotlight/BookingPageLocationSpotlight';
import { DeleteBookingModal } from './DeleteBookingModal';

interface Props {
    canShowSpotlight: boolean;
    page: InternalBookingPage;
    calendars: VisualCalendar[];
}

export const BookingItem = ({ canShowSpotlight, page, calendars }: Props) => {
    const { createNotification } = useNotifications();
    const dispatch = useCalendarDispatch();

    const { openBookingSidebarEdition } = useBookings();
    const spotlight = useBookingPageLocationSpotlight();

    const isEditingEnabled = useFlag('EditCalendarBookings');

    const handleCopy = (e: MouseEvent, link: string) => {
        e.stopPropagation();
        e.preventDefault();

        textToClipboard(link);
        createNotification({ text: c('Info').t`Link copied to clipboard` });
    };

    const [deleteBookingModal, showDeleteModal] = useModalTwo(DeleteBookingModal);

    const bookingPageIcon = (bookingPageID: string) => {
        return <IcCalendarListFilled color={calendars.find((calendar) => calendar.ID === bookingPageID)?.Color} />;
    };

    const handleEditClick = async () => {
        if (!isEditingEnabled) {
            return;
        }

        const { payload } = (await dispatch(loadBookingPage(page.id))) as { payload: BookingPageEditData };
        openBookingSidebarEdition(page, payload);
    };

    return (
        <>
            <SidebarListItem>
                <Spotlight
                    originalPlacement="right"
                    closeIcon="cross-big"
                    content={<BookingPageLocationSpotlightContent />}
                    show={canShowSpotlight && spotlight.shouldShowSpotlight}
                    onDisplayed={spotlight.onDisplayed}
                    onClose={spotlight.onClose}
                >
                    {/* The div can be removed when the spotligh is removed */}
                    <div>
                        <SidebarListItemLabel
                            htmlFor={`booking-page-${page.id}`}
                            className="group-hover-opacity-container"
                        >
                            <SidebarListItemContent left={bookingPageIcon(page.calendarID)}>
                                <div className="flex flex-nowrap justify-space-between items-center w-full">
                                    <p className="text-ellipsis m-0" title={page.summary}>
                                        {page.summary}
                                    </p>
                                </div>
                                <Tooltip title={c('Info').t`Manage booking page`}>
                                    <SimpleDropdown
                                        as={Button}
                                        icon
                                        hasCaret={false}
                                        shape="ghost"
                                        size="small"
                                        onToggle={() => {
                                            spotlight.onClose();
                                        }}
                                        className="group-hover:opacity-100 group-hover:opacity-100-no-width ml-2 mr-custom right-0 rounded-sm shrink-0 hidden md:inline-flex"
                                        content={
                                            <IcThreeDotsHorizontal
                                                alt={c('Sidebar calendar edit tooltip').t`Manage calendar`}
                                            />
                                        }
                                    >
                                        <DropdownMenu>
                                            {isEditingEnabled && (
                                                <DropdownMenuButton onClick={handleEditClick} className="text-left">{c(
                                                    'Action'
                                                ).t`Edit booking page`}</DropdownMenuButton>
                                            )}
                                            <DropdownMenuButton
                                                onClick={() => showDeleteModal({ bookingId: page.id })}
                                                className="text-left"
                                            >
                                                {c('Action').t`Delete booking page`}
                                            </DropdownMenuButton>
                                            <hr className="m-0" />
                                            <DropdownMenuLink
                                                href={page.link}
                                                className="flex flex-nowrap gap-2 justify-space-between items-center"
                                            >
                                                <span className="text-ellipsis color-primary text-underline">
                                                    {page.link}
                                                </span>
                                                <Button
                                                    className="shrink-0"
                                                    shape="ghost"
                                                    size="small"
                                                    onClick={(e) => handleCopy(e, page.link)}
                                                >
                                                    <IcSquares alt={c('Action').t`Copy booking page link`} />
                                                </Button>
                                            </DropdownMenuLink>
                                        </DropdownMenu>
                                    </SimpleDropdown>
                                </Tooltip>
                            </SidebarListItemContent>
                        </SidebarListItemLabel>
                    </div>
                </Spotlight>
            </SidebarListItem>

            {deleteBookingModal}
        </>
    );
};
