import type { MutableRefObject } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useInternalBooking } from '@proton/calendar/bookings/store/hooks';
import type { InternalBookingPage } from '@proton/calendar/bookings/store/interface';
import { BookingCreateAction, useBookingUpsell } from '@proton/calendar/bookings/store/useBookingUpsell';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { IcCalendarList } from '@proton/icons/icons/IcCalendarList';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { escape } from '@proton/sanitize/escape';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import type { BookingPageCount } from '../../../telemetry/composerBookingsEvents';
import {
    BookingLimitReason,
    BookingUpsellSource,
    getBookingPageCountDimension,
    useComposerBookingsTracking,
} from '../../../telemetry/composerBookingsEvents';
import type { ExternalEditorActions } from '../editor/EditorWrapper';

interface Props {
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    onClose: () => void;
    onUpsell: (pageCount: BookingPageCount) => void;
    onLimitReached: () => void;
}

const ComposerBookingDropdownContent = ({ editorActionsRef, onClose, onUpsell, onLimitReached }: Props) => {
    const [internalBooking, loading] = useInternalBooking();
    const { getCreateBookingAction, shouldShowLimitModal, loadingLimits } = useBookingUpsell();
    const authentication = useAuthentication();
    const {
        trackBookingPageInserted,
        trackCreateBookingPageClick,
        trackBookingUpsellDisplayed,
        trackBookingLimitDisplayed,
    } = useComposerBookingsTracking();

    const bookingPages = internalBooking?.bookingPages;
    const pageCount = getBookingPageCountDimension(bookingPages?.length ?? 0);

    const handleInsert = (page: InternalBookingPage) => {
        const name = page.summary || c('Label').t`Booking page`;
        const link = `<a href="${escape(page.link)}">${escape(name)}</a>`;

        editorActionsRef.current?.insertContent(`<p>${c('Info').t`Here is my availability:`} ${link}</p>`);
        trackBookingPageInserted(pageCount);
        onClose();
    };

    const handleCreate = () => {
        const createBookingAction = getCreateBookingAction();

        if (createBookingAction === BookingCreateAction.LimitReached) {
            trackBookingLimitDisplayed(
                shouldShowLimitModal().bookingPageLimitReached
                    ? BookingLimitReason.max_pages
                    : BookingLimitReason.plan_limit,
                pageCount
            );
            onLimitReached();
            return;
        }

        if (createBookingAction === BookingCreateAction.Upsell) {
            trackBookingUpsellDisplayed({ source: BookingUpsellSource.create_booking_page, pageCount });
            onUpsell(pageCount);
            return;
        }

        trackCreateBookingPageClick(pageCount);
        onClose();
        window.open(
            getAppHref('/?action=create-booking', APPS.PROTONCALENDAR, authentication.getLocalID()),
            '_blank',
            'noopener,noreferrer'
        );
    };

    return (
        <>
            <div className="px-4 py-2 text-bold shrink-0">{c('Title').t`Share your availability`}</div>

            <div className="overflow-auto max-h-custom" style={{ '--max-h-custom': '10.125rem' }}>
                {loading && (
                    <div className="flex justify-center py-4">
                        <CircleLoader size="small" />
                    </div>
                )}

                {!loading &&
                    bookingPages?.map((page) => (
                        <DropdownMenuButton
                            key={page.id}
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => {
                                handleInsert(page);
                            }}
                            data-testid="composer:booking-page-item"
                        >
                            <IcCalendarList className="shrink-0" />
                            <span className="ml-2 my-auto flex-1 text-ellipsis">
                                {page.summary || c('Label').t`Booking page`}
                            </span>
                        </DropdownMenuButton>
                    ))}

                {!loading && bookingPages?.length === 0 && (
                    <div className="px-4 py-2 color-weak" data-testid="composer:booking-empty">
                        {c('Info').t`No booking pages yet`}
                    </div>
                )}
            </div>

            <div className="dropdown-item-hr my-2 shrink-0" key="hr-booking" />

            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center shrink-0"
                disabled={loadingLimits || loading}
                onClick={handleCreate}
                data-testid="composer:booking-create"
            >
                <IcPlus className="shrink-0" />
                <span className="ml-2 my-auto flex-1">{c('Action').t`Create a booking page`}</span>
            </DropdownMenuButton>
        </>
    );
};

export default ComposerBookingDropdownContent;
