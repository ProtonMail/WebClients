import type { TelemetryInitOptions } from '@proton/shared/lib/telemetry';

export const lumoTelemetryConfig: Pick<TelemetryInitOptions, 'eventOptions' | 'overriddenPageTitle'> = {
    eventOptions: {
        pageView: true,
        click: false,
        form: false,
        performance: true,
        modal: false,
        exit: false,
    },
    overriddenPageTitle: 'Lumo',
};
