import type { TelemetryInitOptions } from '@proton/shared/lib/telemetry';

export const meetTelemetryConfig: Pick<TelemetryInitOptions, 'eventOptions' | 'overridenPageTitle'> = {
    eventOptions: {
        pageView: false,
        click: false,
        form: false,
        performance: true,
        modal: false,
        exit: false,
    },
    overridenPageTitle: 'Meet',
};
