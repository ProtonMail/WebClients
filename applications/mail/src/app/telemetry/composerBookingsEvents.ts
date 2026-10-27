import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { TelemetryComposerBookingsEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getBaseTelemetryDimensions } from '@proton/shared/lib/helpers/metrics';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

/** Which click surfaced the booking upsell: the composer booking action directly, or "Create a booking page" in the booking dropdown */
export enum BookingUpsellSource {
    booking_action = 'booking_action',
    create_booking_page = 'create_booking_page',
}

/** Why the booking limit modal opened: the absolute maximum of booking pages, or the plan limit for a user who can't pay */
export enum BookingLimitReason {
    max_pages = 'max_pages',
    plan_limit = 'plan_limit',
}

const PAGE_COUNTS = ['0', '1', '2-5', '6+'] as const;

export type BookingPageCount = (typeof PAGE_COUNTS)[number];

/** Which upsell is showing, so its follow-up events carry the same source and page count */
export type BookingUpsellContext =
    | { source: BookingUpsellSource.booking_action }
    | { source: BookingUpsellSource.create_booking_page; pageCount: BookingPageCount };

export const getBookingPageCountDimension = (count: number): BookingPageCount => {
    if (count >= 6) {
        return '6+';
    }

    if (count >= 2) {
        return '2-5';
    }

    return count === 1 ? '1' : '0';
};

type BaseDimensions = Omit<ReturnType<typeof getBaseTelemetryDimensions>, 'isFree'>;

// Filled by getBaseTelemetryDimensions, as sendTelemetryReportWithBaseDimensions does for other measurement groups,
// without isFree: it's always subscription === 'free', so it adds nothing here
const baseDimensions = {
    accountAge: topValues(),
    userLocale: topValues(),
    subscription: topValues(),
    audience: topValues(),
    cycle: topValues(),
};

// The direct upsell path doesn't load the user's booking pages, so there is no count to send
const pageCountSpec = allowed([...PAGE_COUNTS, 'n/a']);

const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.mailComposerBookings,
    delay: false,
} as const;

/** The composer booking button, or its More options item on small screens, was clicked */
const bookingActionClick = defineEvent({
    ...baseEvent,
    event: TelemetryComposerBookingsEvents.booking_action_click,
    dimensions: baseDimensions,
});

/** A booking page was picked in the booking dropdown and inserted into the draft */
const bookingPageInserted = defineEvent({
    ...baseEvent,
    event: TelemetryComposerBookingsEvents.booking_page_inserted,
    dimensions: { ...baseDimensions, pageCount: pageCountSpec },
});

/** "Create a booking page" sent the user to Calendar */
const createBookingPageClick = defineEvent({
    ...baseEvent,
    event: TelemetryComposerBookingsEvents.create_booking_page_click,
    dimensions: { ...baseDimensions, pageCount: pageCountSpec },
});

const upsellDimensions = {
    ...baseDimensions,
    source: allowed(Object.values(BookingUpsellSource)),
    pageCount: pageCountSpec,
};

/** The booking page upsell modal was shown */
const bookingUpsellDisplayed = defineEvent({
    ...baseEvent,
    event: TelemetryComposerBookingsEvents.booking_upsell_displayed,
    dimensions: upsellDimensions,
});

/** The booking page upsell modal was closed without clicking Upgrade */
const bookingUpsellDismissed = defineEvent({
    ...baseEvent,
    event: TelemetryComposerBookingsEvents.booking_upsell_dismissed,
    dimensions: upsellDimensions,
});

/** A subscription started from the booking page upsell went through and the user finished the subscription modal */
const bookingUpsellSubscribed = defineEvent({
    ...baseEvent,
    event: TelemetryComposerBookingsEvents.booking_upsell_subscribed,
    dimensions: upsellDimensions,
});

/** "Create a booking page" opened the booking limit modal */
const bookingLimitDisplayed = defineEvent({
    ...baseEvent,
    event: TelemetryComposerBookingsEvents.booking_limit_displayed,
    dimensions: { ...baseDimensions, reason: allowed(Object.values(BookingLimitReason)), pageCount: pageCountSpec },
});

export const useComposerBookingsTracking = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const getBaseDimensions = (): BaseDimensions => {
        const { isFree, ...dimensions } = getBaseTelemetryDimensions({ user, subscription, userSettings });
        return dimensions;
    };

    const getUpsellDimensions = (context: BookingUpsellContext) => {
        return {
            ...getBaseDimensions(),
            source: context.source,
            pageCount: 'pageCount' in context ? context.pageCount : ('n/a' as const),
        };
    };

    return {
        trackBookingActionClick: () => {
            tracker.emit(bookingActionClick, { dimensions: getBaseDimensions() });
        },
        trackBookingPageInserted: (pageCount: BookingPageCount) => {
            tracker.emit(bookingPageInserted, { dimensions: { ...getBaseDimensions(), pageCount } });
        },
        trackCreateBookingPageClick: (pageCount: BookingPageCount) => {
            tracker.emit(createBookingPageClick, { dimensions: { ...getBaseDimensions(), pageCount } });
        },
        trackBookingUpsellDisplayed: (context: BookingUpsellContext) => {
            tracker.emit(bookingUpsellDisplayed, { dimensions: getUpsellDimensions(context) });
        },
        trackBookingUpsellDismissed: (context: BookingUpsellContext) => {
            tracker.emit(bookingUpsellDismissed, { dimensions: getUpsellDimensions(context) });
        },
        trackBookingUpsellSubscribed: (context: BookingUpsellContext) => {
            tracker.emit(bookingUpsellSubscribed, { dimensions: getUpsellDimensions(context) });
        },
        trackBookingLimitDisplayed: (reason: BookingLimitReason, pageCount: BookingPageCount) => {
            tracker.emit(bookingLimitDisplayed, { dimensions: { ...getBaseDimensions(), reason, pageCount } });
        },
    };
};
