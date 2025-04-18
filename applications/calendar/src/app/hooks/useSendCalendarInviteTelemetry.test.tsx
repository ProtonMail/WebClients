import { renderHook } from '@testing-library/react-hooks';

import { TelemetryCalendarEvents } from '@proton/shared/lib/api/telemetry';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import type { setupStore } from '../store/store';
import { getStoreWrapper } from '../test/Store';
import { useSendCalendarInviteTelemetry } from './useSendCalendarInviteTelemetry';

const setupTest = ({
    preloadedState,
}: { preloadedState?: Parameters<typeof setupStore>[0]['preloadedState'] } = {}) => {
    const { Wrapper, store } = getStoreWrapper({ preloadedState });
    const { result } = renderHook(() => useSendCalendarInviteTelemetry(), { wrapper: Wrapper });

    return {
        result,
        store,
    };
};

jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    sendTelemetryReport: jest.fn(),
}));

describe('useSendCalendarInviteTelemetry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        ['yes', ICAL_ATTENDEE_STATUS.ACCEPTED],
        ['maybe', ICAL_ATTENDEE_STATUS.TENTATIVE],
        ['no', ICAL_ATTENDEE_STATUS.DECLINED],
    ])('Should send `answer: "%s"` in dimensions when invite is %s', async (expectedAnswer, attendeeStatus) => {
        const { result } = setupTest();
        const sendReport = result.current;

        const mockSendReport = sendTelemetryReport as jest.Mock;

        await sendReport({
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: attendeeStatus, hasComment: false },
        });

        expect(mockSendReport.mock.calls[0][0].dimensions).toHaveProperty('answer', expectedAnswer);
    });

    /**
     * Those cases are not expected to happen, so we should do nothing
     */
    it.each([ICAL_ATTENDEE_STATUS.DELEGATED, ICAL_ATTENDEE_STATUS.NEEDS_ACTION, undefined, 'randomValue'])(
        'Should do nothing when attendee status is %s',
        async (attendeeStatus) => {
            const { result } = setupTest();
            const sendReport = result.current;

            const mockSendReport = sendTelemetryReport as jest.Mock;

            await sendReport({
                event: TelemetryCalendarEvents.answer_invite,
                // @ts-expect-error - We want to test the error case
                dimensions: { answer: attendeeStatus, hasComment: 'no' },
            });

            expect(mockSendReport).not.toHaveBeenCalled();
        }
    );

    it.each([
        ['yes', true],
        ['no', false],
    ])('Should send `hasComment: "%s"` in dimensions when invite is %s', async (expectedAnswer, hasComment) => {
        const { result } = setupTest();
        const sendReport = result.current;

        const mockSendReport = sendTelemetryReport as jest.Mock;

        await sendReport({
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: ICAL_ATTENDEE_STATUS.ACCEPTED, hasComment },
        });

        expect(mockSendReport.mock.calls[0][0].dimensions).toHaveProperty('hasComment', expectedAnswer);
    });
});
