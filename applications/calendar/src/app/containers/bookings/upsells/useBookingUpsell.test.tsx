import { renderHook } from '@testing-library/react-hooks';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ADDON_NAMES, PLANS, PLAN_TYPES } from '@proton/payments';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { MAX_BOOKING_PAGES } from '../interface';
import { useBookingUpsell } from './useBookingUpsell';

jest.mock('@proton/account/user/hooks');
const mockUseUser = jest.mocked(useUser);

jest.mock('@proton/account/organization/hooks');
const mockUseOrganization = jest.mocked(useOrganization);

jest.mock('../../../store/internalBooking/bookingsHook');
const mockUseInternalBooking = jest.mocked(useInternalBooking);

jest.mock('@proton/account/subscription/hooks');
const mockUseSubscription = jest.mocked(useSubscription);

const mockBookingPage = (id: string) => ({
    id,
    bookingUID: `uid-${id}`,
    calendarID: 'cal-1',
    summary: `Booking ${id}`,
    link: `https://example.com/${id}`,
    withProtonMeetLink: false,
    verificationErrors: {},
    minimumNoticeMode: 0,
    conflictCalendarIDs: [],
});

const getBookingPagesArray = (bookingPagesCount: number) =>
    Array.from({ length: bookingPagesCount }, (_, i) => mockBookingPage(`page-${i}`));

describe('useBookingUpsell', () => {
    beforeEach(() => {
        mockUseSubscription.mockReturnValue([] as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('shouldShowLimitModal', () => {
        it('should return no limits reached when user is below all limits', () => {
            mockUseUser.mockReturnValue([{ hasPaidMail: true, hasPaidMeet: false }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.MAIL }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: [] }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: false });
        });

        it('should return planLimitReached when user hits plan limit but not booking page limit', () => {
            mockUseUser.mockReturnValue([{ hasPaidMail: true, hasPaidMeet: false }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.MAIL }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(1) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: true, bookingPageLimitReached: false });
        });

        it('should return bookingPageLimitReached when user hits the absolute booking page limit', () => {
            mockUseUser.mockReturnValue([{ hasPaidMail: true, hasPaidMeet: false }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.VISIONARY }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(MAX_BOOKING_PAGES) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: true });
        });

        it('should prioritize bookingPageLimitReached when both limits are reached', () => {
            mockUseUser.mockReturnValue([{ hasPaidMail: true, hasPaidMeet: false }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.MAIL }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(MAX_BOOKING_PAGES) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: true });
        });

        it('should return planLimitReached for free users with no booking pages', () => {
            mockUseUser.mockReturnValue([{ hasPaidMail: false, hasPaidMeet: false }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.MAIL }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(0) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: true, bookingPageLimitReached: false });
        });

        it('should handle undefined bookings gracefully', () => {
            mockUseUser.mockReturnValue([{ hasPaidMail: false, hasPaidMeet: false }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.MAIL }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: undefined }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: true, bookingPageLimitReached: false });
        });

        it('should return no limits for high-tier plans below their limit', () => {
            mockUseUser.mockReturnValue([{ hasPaidMail: true, hasPaidMeet: false }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.VISIONARY }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(10) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: false });
        });
    });

    describe('addon tests', () => {
        beforeEach(() => {
            mockUseUser.mockReturnValue([{ hasPaidMail: false, hasPaidMeet: true }] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(10) }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.DUO }, false] as any);
        });

        it('should return no limit reached for account with less than max booking pages', () => {
            mockUseSubscription.mockReturnValue([
                {
                    Plans: [
                        {
                            Type: PLAN_TYPES.ADDON,
                            PlanName: ADDON_NAMES.MEET_LUMO,
                            Name: ADDON_NAMES.MEET_LUMO,
                        },
                    ],
                },
            ] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: false });
        });

        it('should return booking limit reached for account with max booking pages', () => {
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(MAX_BOOKING_PAGES) }] as any);
            mockUseSubscription.mockReturnValue([
                {
                    Plans: [
                        {
                            Type: PLAN_TYPES.ADDON,
                            PlanName: ADDON_NAMES.MEET_LUMO,
                            Name: ADDON_NAMES.MEET_LUMO,
                        },
                    ],
                },
            ] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: true });
        });
    });

    describe('organisation member limit testing', () => {
        beforeEach(() => {
            mockUseUser.mockReturnValue([{ isMember: true }] as any);
            mockUseSubscription.mockReturnValue([] as any);
        });

        it('should return no limit for Mail B2B member with no booking pages', () => {
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.BUNDLE_BIZ_2025 }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: [] }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: false });
        });

        it('should return bookingPageLimitReached for Mail B2B member at absolute limit', () => {
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.BUNDLE_BIZ_2025 }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(MAX_BOOKING_PAGES) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: true });
        });

        it('should return no limit for member with meet add-on within limit', () => {
            mockUseUser.mockReturnValue([{ isMember: true, hasPaidMeet: true }] as any);
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.FAMILY }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(2) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: false });
        });

        it('should return planLimitReached for Mail B2C member at plan limit', () => {
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.FAMILY }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: getBookingPagesArray(1) }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: true, bookingPageLimitReached: false });
        });

        it('should return no limit for Mail B2C member with no booking pages', () => {
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.FAMILY }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: [] }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: false, bookingPageLimitReached: false });
        });

        it('should return planLimitReached for member on non-mail plan with no booking pages', () => {
            mockUseOrganization.mockReturnValue([{ PlanName: PLANS.VPN_BUSINESS }, false] as any);
            mockUseInternalBooking.mockReturnValue([{ bookingPages: [] }] as any);

            const { result } = renderHook(() => useBookingUpsell());
            const limits = result.current.shouldShowLimitModal();

            expect(limits).toEqual({ planLimitReached: true, bookingPageLimitReached: false });
        });
    });
});
