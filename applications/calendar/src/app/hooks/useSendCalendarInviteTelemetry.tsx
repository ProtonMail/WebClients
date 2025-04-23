import { useSubscription } from '@proton/account/subscription/hooks';
import useApi from '@proton/components/hooks/useApi';
import { PLANS, getPlan } from '@proton/payments';
import type { TelemetryCalendarEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

type Options = {
    event: TelemetryCalendarEvents.answer_invite;
    dimensions: {
        answer: ICAL_ATTENDEE_STATUS;
        hasComment: boolean;
    };
};

export const useSendCalendarInviteTelemetry = () => {
    const api = useApi();
    const [subscription] = useSubscription();
    const plan = getPlan(subscription)?.Name || PLANS.FREE;

    /**
     * Convert the attendee status to the expected format for Telemetry
     * @throws Error if the status is not expected
     */
    const getResponseType = (status: ICAL_ATTENDEE_STATUS) => {
        switch (status) {
            case ICAL_ATTENDEE_STATUS.ACCEPTED:
                return 'yes';
            case ICAL_ATTENDEE_STATUS.TENTATIVE:
                return 'maybe';
            case ICAL_ATTENDEE_STATUS.DECLINED:
                return 'no';
            default:
                throw new Error(`Those attendees statuses are not expected to be sent to Telemetry: ${status}`);
        }
    };

    return (options: Options) => {
        try {
            const answer = getResponseType(options.dimensions.answer);

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.calendarInvite,
                event: options.event,
                silence: true,
                dimensions: {
                    answer,
                    hasComment: !!options.dimensions.hasComment ? 'yes' : 'no',
                    plan,
                },
                delay: false,
            });
        } catch (error) {}
    };
};
