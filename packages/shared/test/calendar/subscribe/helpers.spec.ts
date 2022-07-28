import { getCalendarIsNotSyncedInfo, getSyncingInfo, getNotSyncedInfo } from '../../../lib/calendar/subscribe/helpers';
import { HOUR } from '../../../lib/constants';
import { CALENDAR_SUBSCRIPTION_STATUS, CALENDAR_TYPE, VisualCalendar } from '../../../lib/interfaces/calendar';

const {
    OK,
    INVALID_ICS,
    ICS_SIZE_EXCEED_LIMIT,
    SYNCHRONIZING,
    HTTP_REQUEST_FAILED_BAD_REQUEST,
    HTTP_REQUEST_FAILED_UNAUTHORIZED,
    HTTP_REQUEST_FAILED_FORBIDDEN,
    HTTP_REQUEST_FAILED_NOT_FOUND,
    HTTP_REQUEST_FAILED_GENERIC,
    HTTP_REQUEST_FAILED_INTERNAL_SERVER_ERROR,
    HTTP_REQUEST_FAILED_TIMEOUT,
    CALENDAR_MISSING_PRIMARY_KEY,
    INTERNAL_CALENDAR_URL_NOT_FOUND,
    INTERNAL_CALENDAR_UNDECRYPTABLE,
} = CALENDAR_SUBSCRIPTION_STATUS;

describe('getSyncingInfo', () => {
    it('passes an object with the correct label and text', () => {
        expect(getSyncingInfo('dog')).toEqual({ label: 'Syncing', text: 'dog' });
    });
});

describe('getNotSyncedInfo', () => {
    it('passes an object with the correct label and text', () => {
        expect(getNotSyncedInfo('dog')).toEqual({ label: 'Not synced', text: 'dog' });
    });
});

describe('getCalendarIsNotSyncedInfo', () => {
    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('returns the correct message based on the status', () => {
        const mockDate = new Date(2020, 11, 11, 0, 0, 0);
        jasmine.clock().mockDate(mockDate);

        const calendarCommon: VisualCalendar = {
            ID: 'calendarID',
            Name: 'calendarName',
            Description: 'calendarDescription',
            Display: 1,
            Color: '#f00',
            Flags: 1,
            Email: 'email',
            Type: CALENDAR_TYPE.SUBSCRIPTION,
            Members: [],
        };

        const calendarSubscriptionCommon = {
            CalendarID: calendarCommon.ID,
            CreateTime: 0,
            LastUpdateTime: mockDate.getTime() / 1000 + 1000,
            URL: 'okCalendarURL',
        };

        const getCommonCalendarWithStatus = (status: CALENDAR_SUBSCRIPTION_STATUS) => ({
            ...calendarCommon,
            SubscriptionParameters: {
                ...calendarSubscriptionCommon,
                Status: status,
            },
        });

        const notSyncedYetCalendar = {
            ...calendarCommon,
            SubscriptionParameters: {
                ...calendarSubscriptionCommon,
                LastUpdateTime: 0,
                Status: OK,
            },
        };

        const syncPeriodTooLongCalendar = {
            ...calendarCommon,
            SubscriptionParameters: {
                ...calendarSubscriptionCommon,
                LastUpdateTime: calendarSubscriptionCommon.LastUpdateTime - 12 * HOUR,
                Status: OK,
            },
        };

        expect(getCalendarIsNotSyncedInfo(notSyncedYetCalendar)).toEqual(getSyncingInfo('Calendar is syncing'));
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(OK))).toBe(null);
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(9999))).toEqual(
            getNotSyncedInfo('Failed to sync calendar')
        );

        [
            OK,
            INVALID_ICS,
            ICS_SIZE_EXCEED_LIMIT,
            SYNCHRONIZING,
            HTTP_REQUEST_FAILED_BAD_REQUEST,
            HTTP_REQUEST_FAILED_UNAUTHORIZED,
            HTTP_REQUEST_FAILED_FORBIDDEN,
            HTTP_REQUEST_FAILED_NOT_FOUND,
            HTTP_REQUEST_FAILED_GENERIC,
            HTTP_REQUEST_FAILED_INTERNAL_SERVER_ERROR,
            HTTP_REQUEST_FAILED_TIMEOUT,
            INTERNAL_CALENDAR_URL_NOT_FOUND,
            INTERNAL_CALENDAR_UNDECRYPTABLE,
            CALENDAR_MISSING_PRIMARY_KEY,
        ].forEach((status) =>
            expect(
                getCalendarIsNotSyncedInfo({
                    ...syncPeriodTooLongCalendar,
                    SubscriptionParameters: {
                        ...syncPeriodTooLongCalendar.SubscriptionParameters,
                        Status: status,
                    },
                })
            ).toEqual(getNotSyncedInfo('More than 12 hours passed since last update'))
        );
        expect(
            getCalendarIsNotSyncedInfo({
                ...syncPeriodTooLongCalendar,
                SubscriptionParameters: {
                    ...syncPeriodTooLongCalendar.SubscriptionParameters,
                    LastUpdateTime: syncPeriodTooLongCalendar.SubscriptionParameters.LastUpdateTime + 12 * HOUR + 1,
                },
            })
        ).toBe(null);
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(INVALID_ICS))).toEqual(
            getNotSyncedInfo('Unsupported calendar format')
        );
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(ICS_SIZE_EXCEED_LIMIT))).toEqual(
            getNotSyncedInfo('Calendar is too big')
        );
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(SYNCHRONIZING))).toEqual(
            getSyncingInfo('Calendar is syncing')
        );

        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(HTTP_REQUEST_FAILED_BAD_REQUEST))).toEqual(
            getNotSyncedInfo('Calendar link is not accessible')
        );
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(HTTP_REQUEST_FAILED_UNAUTHORIZED))).toEqual(
            getNotSyncedInfo('Calendar link is not accessible')
        );
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(HTTP_REQUEST_FAILED_FORBIDDEN))).toEqual(
            getNotSyncedInfo('Calendar link is not accessible')
        );
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(HTTP_REQUEST_FAILED_NOT_FOUND))).toEqual(
            getNotSyncedInfo('Calendar link is not accessible')
        );
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(INTERNAL_CALENDAR_URL_NOT_FOUND))).toEqual(
            getNotSyncedInfo('Calendar link is not accessible')
        );

        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(HTTP_REQUEST_FAILED_GENERIC))).toEqual(
            getNotSyncedInfo('Calendar link is temporarily inaccessible')
        );
        expect(
            getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(HTTP_REQUEST_FAILED_INTERNAL_SERVER_ERROR))
        ).toEqual(getNotSyncedInfo('Calendar link is temporarily inaccessible'));
        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(HTTP_REQUEST_FAILED_TIMEOUT))).toEqual(
            getNotSyncedInfo('Calendar link is temporarily inaccessible')
        );

        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(INTERNAL_CALENDAR_UNDECRYPTABLE))).toEqual(
            getNotSyncedInfo('Calendar could not be decrypted')
        );

        expect(getCalendarIsNotSyncedInfo(getCommonCalendarWithStatus(CALENDAR_MISSING_PRIMARY_KEY))).toEqual(
            getNotSyncedInfo('Failed to sync calendar')
        );
    });
});
