import type { MutableRefObject } from 'react';
import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useGetInternalBooking } from '@proton/calendar/bookings/store/hooks';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { EditorMetadata } from '@proton/components/components/editor/interface';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import { BookingsLimitReached } from '@proton/components/containers/calendar/BookingsLimitReached';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcCalendarList } from '@proton/icons/icons/IcCalendarList';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { CacheType } from '@proton/redux-utilities/interface';
import { APPS, APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';
import bookingImg from '@proton/styles/assets/img/illustrations/new-upsells-img/booking_page.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useMailDispatch } from '../../../store/hooks';
import { updateExpires } from '../../../store/messages/draft/messagesDraftActions';
import type { BookingUpsellContext } from '../../../telemetry/composerBookingsEvents';
import { BookingUpsellSource, useComposerBookingsTracking } from '../../../telemetry/composerBookingsEvents';
import type { MessageChange, MessageChangeFlag } from '../Composer';
import type { ExternalEditorActions } from '../editor/EditorWrapper';
import ComposerBookingDropdownContent from './ComposerBookingDropdownContent';
import ComposerMoreOptionsDropdown from './ComposerMoreOptionsDropdown';
import MoreActionsExtension from './MoreActionsExtension';
import {
    ComposerBookingSpotlightContent,
    useComposerBookingSpotlight,
} from './bookingSpotlight/useComposerBookingSpotlight';

/**
 * Reuses the calendar booking-page feature path so paid Mail users get the dedicated bookings
 * offer from getUpsellModalBookingsConfig rather than the generic upsell, while still being
 * attributed to Mail.
 */
const bookingUpsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: CALENDAR_UPSELL_PATHS.BOOKING_PAGE,
});

interface Props {
    isExpiration: boolean;
    message: MessageState;
    onExpiration: () => void;
    lock: boolean;
    onChangeFlag: MessageChangeFlag;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    editorMetadata: EditorMetadata;
    onChange: MessageChange;
    isPassword: boolean;
    onPassword: () => void;
    onRemoveOutsideEncryption: () => void;
    onDelete: () => void;
}

const ComposerMoreActions = ({
    isExpiration,
    message,
    onExpiration,
    lock,
    onChangeFlag,
    editorActionsRef,
    editorMetadata,
    onChange,
    isPassword,
    onPassword,
    onRemoveOutsideEncryption,
    onDelete,
}: Props) => {
    const dispatch = useMailDispatch();

    const bookingsDisabled = useFlag('CalendarBookingsDisabled');
    const bookingsInComposerEnabled = useFlag('BookingsInComposerEnabled');

    const bookingDropdown = usePopperAnchor<HTMLButtonElement>();
    const bookingUpsellModal = useModalStateObject();
    const bookingLimitModal = useModalStateObject();
    const getInternalBooking = useGetInternalBooking();
    const {
        trackBookingActionClick,
        trackBookingUpsellDisplayed,
        trackBookingUpsellDismissed,
        trackBookingUpsellSubscribed,
    } = useComposerBookingsTracking();
    // Set when the upsell opens, so dismissing it or subscribing from it reports the same source and page count
    const bookingUpsellContextRef = useRef<BookingUpsellContext>({ source: BookingUpsellSource.booking_action });
    const [user] = useUser();

    const showBookingAction = !bookingsDisabled && bookingsInComposerEnabled;
    const bookingSpotlight = useComposerBookingSpotlight(
        bookingsDisabled,
        bookingsInComposerEnabled,
        editorMetadata.isPlainText
    );
    const moreOptionsAnchorRef = useRef<HTMLDivElement>(null);

    const breakpoints = useActiveBreakpoint();
    const isSmallViewport = breakpoints.viewportWidth['<=small'];

    const titleMoreOptions = c('Title').t`More options`;
    const titleBooking = c('Title').t`Insert a booking page`;

    const toolbarExtension = useMemo(
        () => (
            <MoreActionsExtension
                message={message}
                onChangeFlag={onChangeFlag}
                editorActionsRef={editorActionsRef}
                editorMetadata={editorMetadata}
                onChange={onChange}
            />
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CB37E4
        [message.data, onChangeFlag]
    );

    const handleRemoveExpiration = () => {
        onChange({ draftFlags: { expiresIn: undefined } });
        dispatch(updateExpires({ ID: message?.localID || '', expiresIn: undefined }));
    };

    const handleBookingAction = () => {
        bookingSpotlight.onClose();

        if (bookingDropdown.isOpen) {
            bookingDropdown.close();
            return;
        }

        trackBookingActionClick();

        if (user.isFree && user.canPay) {
            bookingUpsellContextRef.current = { source: BookingUpsellSource.booking_action };
            trackBookingUpsellDisplayed(bookingUpsellContextRef.current);
            bookingUpsellModal.openModal(true);
            return;
        }

        // Refetch so a page created in Calendar since the last open, e.g. through "Create a booking page", is listed
        void getInternalBooking({ cache: CacheType.None });
        bookingDropdown.open();
    };

    // On small viewports the booking dropdown is anchored to the More options wrapper, so clicking More options
    // doesn't count as an outside click and the booking dropdown has to be closed here
    const handleMoreOptionsOpen = () => {
        bookingSpotlight.onClose();
        bookingDropdown.close();
    };

    const dotsInColor = isExpiration || isPassword;

    return (
        <>
            {showBookingAction && !isSmallViewport && (
                <Spotlight
                    originalPlacement="top-end"
                    show={bookingSpotlight.shouldShowSpotlight}
                    onDisplayed={bookingSpotlight.onDisplayed}
                    onClose={bookingSpotlight.onClose}
                    anchorRef={bookingDropdown.anchorRef}
                    content={<ComposerBookingSpotlightContent />}
                    borderRadius="lg"
                >
                    <Tooltip title={titleBooking}>
                        <Button
                            ref={bookingDropdown.anchorRef}
                            icon
                            shape="ghost"
                            onClick={handleBookingAction}
                            disabled={lock || editorMetadata.isPlainText}
                            aria-expanded={bookingDropdown.isOpen}
                            className="flex"
                            data-testid="composer:booking-button"
                        >
                            <IcCalendarList alt={titleBooking} />
                        </Button>
                    </Tooltip>
                </Spotlight>
            )}
            <div ref={moreOptionsAnchorRef} className="flex">
                <ComposerMoreOptionsDropdown
                    titleTooltip={titleMoreOptions}
                    className="button button-medium button-ghost-weak button-for-icon composer-more-dropdown"
                    size={{ width: DropdownSizeUnit.Dynamic, height: DropdownSizeUnit.Dynamic }}
                    onOpen={handleMoreOptionsOpen}
                    content={
                        <IcThreeDotsHorizontal
                            alt={titleMoreOptions}
                            className={clsx([dotsInColor && 'color-primary'])}
                        />
                    }
                >
                    {toolbarExtension}
                    <div className="dropdown-item-hr" key="hr-more-options" />
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        onClick={onExpiration}
                        aria-pressed={isExpiration}
                        disabled={lock}
                        data-testid="composer:expiration-button"
                    >
                        <IcHourglass />
                        <span className="ml-2 my-auto flex-1">
                            {isExpiration ? c('Action').t`Set expiration time` : c('Action').t`Expiration time`}
                        </span>
                    </DropdownMenuButton>

                    {isExpiration && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center color-danger"
                            onClick={handleRemoveExpiration}
                            aria-pressed={isExpiration}
                            disabled={lock}
                            data-testid="composer:remove-expiration-button"
                        >
                            <IcTrash />
                            <span className="ml-2 my-auto flex-1">{c('Action').t`Remove expiration time`}</span>
                        </DropdownMenuButton>
                    )}

                    {showBookingAction && isSmallViewport && (
                        <>
                            <div className="dropdown-item-hr" key="hr-booking" />
                            <DropdownMenuButton
                                className="text-left flex flex-nowrap items-center"
                                onClick={handleBookingAction}
                                disabled={lock || editorMetadata.isPlainText}
                                data-testid="composer:booking-button"
                            >
                                <IcCalendarList />
                                <span className="ml-2 my-auto flex-1">{titleBooking}</span>
                            </DropdownMenuButton>
                        </>
                    )}

                    {isSmallViewport && (
                        <>
                            <div className="dropdown-item-hr" key="hr-more-options" />

                            <DropdownMenuButton
                                className="text-left flex flex-nowrap items-center"
                                onClick={onPassword}
                                aria-pressed={isPassword}
                                data-testid="composer:encryption-button"
                            >
                                <IcLock />
                                <span className="ml-2 my-auto flex-1">
                                    {isPassword ? c('Action').t`Edit encryption` : c('Action').t`External encryption`}
                                </span>
                            </DropdownMenuButton>

                            {isPassword && (
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap items-center color-danger"
                                    onClick={onRemoveOutsideEncryption}
                                    aria-pressed={isPassword}
                                    data-testid="composer:remove-encryption-button"
                                >
                                    <IcTrash />
                                    <span className="ml-2 my-auto flex-1">{c('Action').t`Remove encryption`}</span>
                                </DropdownMenuButton>
                            )}

                            <div className="dropdown-item-hr" key="hr-more-options" />

                            <DropdownMenuButton
                                className="text-left flex flex-nowrap items-center"
                                onClick={onDelete}
                                data-testid="composer:delete-draft-button"
                            >
                                <IcTrash />
                                <span className="ml-2 my-auto flex-1">{c('Action').t`Delete draft`}</span>
                            </DropdownMenuButton>
                        </>
                    )}
                </ComposerMoreOptionsDropdown>
            </div>

            {showBookingAction && (
                <Dropdown
                    isOpen={bookingDropdown.isOpen}
                    anchorRef={isSmallViewport ? moreOptionsAnchorRef : bookingDropdown.anchorRef}
                    onClose={bookingDropdown.close}
                    originalPlacement="top-start"
                    size={{ width: DropdownSizeUnit.Dynamic, height: DropdownSizeUnit.Dynamic }}
                    contentProps={{ className: 'flex flex-column flex-nowrap' }}
                >
                    <ComposerBookingDropdownContent
                        editorActionsRef={editorActionsRef}
                        onClose={bookingDropdown.close}
                        onUpsell={(pageCount) => {
                            bookingUpsellContextRef.current = {
                                source: BookingUpsellSource.create_booking_page,
                                pageCount,
                            };
                            bookingDropdown.close();
                            bookingUpsellModal.openModal(true);
                        }}
                        onLimitReached={() => {
                            bookingDropdown.close();
                            bookingLimitModal.openModal(true);
                        }}
                    />
                </Dropdown>
            )}

            {bookingUpsellModal.render && (
                <UpsellModal
                    title={c('Title').t`Share your availability`}
                    description={c('Description')
                        .t`Let people book time with you directly from your emails, without the back and forth.`}
                    illustration={bookingImg}
                    modalProps={bookingUpsellModal.modalProps}
                    upsellRef={bookingUpsellRef}
                    onClose={() => {
                        trackBookingUpsellDismissed(bookingUpsellContextRef.current);
                    }}
                    onSubscribed={() => {
                        trackBookingUpsellSubscribed(bookingUpsellContextRef.current);
                    }}
                    data-testid="composer:booking-upsell-modal"
                />
            )}

            {bookingLimitModal.render && (
                <BookingsLimitReached app={APPS.PROTONMAIL} {...bookingLimitModal.modalProps} />
            )}
        </>
    );
};

export default ComposerMoreActions;
