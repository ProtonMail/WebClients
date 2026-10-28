import { renderHook } from '@testing-library/react';

import { TelemetryComposerBookingsEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { mockTracker } from '@proton/telemetry-tracker/testing';

import {
    BookingLimitReason,
    BookingUpsellSource,
    getBookingPageCountDimension,
    useComposerBookingsTracking,
} from './composerBookingsEvents';

jest.mock('@proton/account/user/hooks', () => ({ useUser: () => [{}] }));
jest.mock('@proton/account/subscription/hooks', () => ({ useSubscription: () => [{}] }));
jest.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: () => [{}] }));
jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    getBaseTelemetryDimensions: () => ({
        accountAge: '31-60',
        userLocale: 'en_GB',
        subscription: 'mail2022',
        audience: 'b2c',
        isFree: 'false',
        cycle: '12',
    }),
}));

// isFree is left out of this group, because it's always subscription === 'free'
const baseDimensions = {
    accountAge: '31-60',
    userLocale: 'en_GB',
    subscription: 'mail2022',
    audience: 'b2c',
    cycle: '12',
};

describe('getBookingPageCountDimension', () => {
    it.each([
        [0, '0'],
        [1, '1'],
        [2, '2-5'],
        [5, '2-5'],
        [6, '6+'],
        [25, '6+'],
    ])('should bucket %i booking pages as %s', (count, expected) => {
        expect(getBookingPageCountDimension(count)).toBe(expected);
    });
});

describe('useComposerBookingsTracking', () => {
    let tracker: ReturnType<typeof mockTracker>;

    beforeEach(() => {
        tracker = mockTracker();
    });

    afterEach(() => {
        tracker.restore();
    });

    const getTracking = () => {
        return renderHook(() => useComposerBookingsTracking()).result.current;
    };

    it('should send the booking action click with the base dimensions and no delay', () => {
        getTracking().trackBookingActionClick();

        expect(tracker.reports).toEqual([
            expect.objectContaining({
                measurementGroup: TelemetryMeasurementGroups.mailComposerBookings,
                event: TelemetryComposerBookingsEvents.booking_action_click,
                dimensions: baseDimensions,
                delay: false,
            }),
        ]);
    });

    it('should send the page count with a booking page insertion', () => {
        getTracking().trackBookingPageInserted('2-5');

        expect(tracker.reports[0]).toEqual(
            expect.objectContaining({
                event: TelemetryComposerBookingsEvents.booking_page_inserted,
                dimensions: { ...baseDimensions, pageCount: '2-5' },
            })
        );
    });

    it('should send the page count when Create a booking page sends the user to Calendar', () => {
        getTracking().trackCreateBookingPageClick('1');

        expect(tracker.reports[0]).toEqual(
            expect.objectContaining({
                event: TelemetryComposerBookingsEvents.create_booking_page_click,
                dimensions: { ...baseDimensions, pageCount: '1' },
            })
        );
    });

    it('should send n/a as the page count for the direct upsell', () => {
        getTracking().trackBookingUpsellDisplayed({ source: BookingUpsellSource.booking_action });

        expect(tracker.reports[0]).toEqual(
            expect.objectContaining({
                event: TelemetryComposerBookingsEvents.booking_upsell_displayed,
                dimensions: { ...baseDimensions, source: BookingUpsellSource.booking_action, pageCount: 'n/a' },
            })
        );
    });

    it('should send the page count for the upsell from Create a booking page', () => {
        getTracking().trackBookingUpsellDisplayed({ source: BookingUpsellSource.create_booking_page, pageCount: '6+' });

        expect(tracker.reports[0]).toEqual(
            expect.objectContaining({
                event: TelemetryComposerBookingsEvents.booking_upsell_displayed,
                dimensions: { ...baseDimensions, source: BookingUpsellSource.create_booking_page, pageCount: '6+' },
            })
        );
    });

    it.each([
        ['dismissed', 'trackBookingUpsellDismissed', TelemetryComposerBookingsEvents.booking_upsell_dismissed],
        ['subscribed', 'trackBookingUpsellSubscribed', TelemetryComposerBookingsEvents.booking_upsell_subscribed],
    ] as const)('should send n/a as the page count when the direct upsell is %s', (_, track, event) => {
        getTracking()[track]({ source: BookingUpsellSource.booking_action });

        expect(tracker.reports[0]).toEqual(
            expect.objectContaining({
                event,
                dimensions: { ...baseDimensions, source: BookingUpsellSource.booking_action, pageCount: 'n/a' },
            })
        );
    });

    it.each([
        ['dismissed', 'trackBookingUpsellDismissed', TelemetryComposerBookingsEvents.booking_upsell_dismissed],
        ['subscribed', 'trackBookingUpsellSubscribed', TelemetryComposerBookingsEvents.booking_upsell_subscribed],
    ] as const)('should send the page count when the upsell from Create a booking page is %s', (_, track, event) => {
        getTracking()[track]({ source: BookingUpsellSource.create_booking_page, pageCount: '1' });

        expect(tracker.reports[0]).toEqual(
            expect.objectContaining({
                event,
                dimensions: { ...baseDimensions, source: BookingUpsellSource.create_booking_page, pageCount: '1' },
            })
        );
    });

    it('should send the reason and page count when the booking limit modal opens', () => {
        getTracking().trackBookingLimitDisplayed(BookingLimitReason.max_pages, '6+');

        expect(tracker.reports[0]).toEqual(
            expect.objectContaining({
                event: TelemetryComposerBookingsEvents.booking_limit_displayed,
                dimensions: { ...baseDimensions, reason: BookingLimitReason.max_pages, pageCount: '6+' },
            })
        );
    });
});
