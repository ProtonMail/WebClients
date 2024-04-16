import { TelemetryCalendarEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { PLANS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { Api } from '@proton/shared/lib/interfaces';

type Options = {
    event: TelemetryCalendarEvents.answer_invite;
    dimensions: {
        answer: 'yes' | 'no' | 'maybe';
        plan: PLANS;
    };
};

export const sendCalendarInviteReport = async (api: Api, options: Options) => {
    await sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.calendarInvite,
        event: options.event,
        silence: true,
        ...('dimensions' in options ? { dimensions: options.dimensions } : {}),
    });
};
