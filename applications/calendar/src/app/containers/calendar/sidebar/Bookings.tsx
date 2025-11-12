import { type MouseEvent, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SidebarListItem from '@proton/components/components/sidebar/SidebarListItem';
import SidebarListItemContent from '@proton/components/components/sidebar/SidebarListItemContent';
import SidebarListItemLabel from '@proton/components/components/sidebar/SidebarListItemLabel';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import { DropdownMenu, DropdownMenuButton, DropdownMenuLink, useNotifications } from '@proton/components/index';
import { IcCalendarRow } from '@proton/icons/icons/IcCalendarRow';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { useCalendarDispatch } from '../../../store/hooks';
import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { deleteBookingPageThunk } from '../../../store/internalBooking/interalBookingSlice';
import { UpsellBookings } from '../../bookings/UpsellBookings';
import { useBookings } from '../../bookings/bookingsProvider/BookingsProvider';
import { useBookingsAvailability } from '../../bookings/useBookingsAvailability';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
    utcDate: Date;
    disabled: boolean;
}

export const Bookings = ({ headerRef, utcDate, disabled }: Props) => {
    const [displayBookings, setDisplayBookings] = useState(true);
    const [user] = useUser();
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const dispatch = useCalendarDispatch();

    const { createNotification } = useNotifications();

    const [{ bookingPages }] = useInternalBooking();

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

    const handleCopy = (e: MouseEvent, link: string) => {
        e.stopPropagation();
        e.preventDefault();

        textToClipboard(link);
        createNotification({ text: c('Info').t`Link copied to clipboard` });
    };

    return (
        <>
            <SidebarList>
                <SimpleSidebarListItemHeader
                    toggle={displayBookings}
                    onToggle={() => setDisplayBookings((prevState) => !prevState)}
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
                    spaceAbove
                />
                {displayBookings &&
                    bookingPages.map((page) => (
                        <SidebarListItem key={page.id}>
                            <SidebarListItemLabel
                                htmlFor={`booking-page-${page.id}`}
                                className="group-hover-opacity-container"
                            >
                                <SidebarListItemContent left={<IcCalendarRow />}>
                                    <div className="flex flex-nowrap justify-space-between items-center w-full">
                                        <p className="text-ellipsis m-0" title={page.summary}>
                                            {page.summary}
                                        </p>
                                    </div>
                                    <Tooltip title={c('Info').t`Manange booking page`}>
                                        <SimpleDropdown
                                            as={Button}
                                            icon
                                            hasCaret={false}
                                            shape="ghost"
                                            size="small"
                                            className="group-hover:opacity-100 group-hover:opacity-100-no-width ml-2 mr-custom right-0 rounded-sm shrink-0 hidden md:inline-flex"
                                            content={
                                                <IcThreeDotsHorizontal
                                                    alt={c('Sidebar calendar edit tooltip').t`Manage calendar`}
                                                />
                                            }
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuButton disabled className="text-left">{c('Action')
                                                    .t`Edit booking page`}</DropdownMenuButton>
                                                <DropdownMenuButton
                                                    onClick={() => dispatch(deleteBookingPageThunk(page.id))}
                                                    className="text-left">
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
                        </SidebarListItem>
                    ))}
            </SidebarList>

            {renderModal && <UpsellBookings {...modalProps} />}
        </>
    );
};
