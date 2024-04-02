import { TelemetryMeasurementGroups, TelemetryPaymentsEvents } from '@proton/shared/lib/api/telemetry';
import { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { Api, Cycle } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useApi } from '../../hooks';
import { PaymentMethodFlows } from '../core';
import { PaymentProcessorType, getSystemByHookType } from '../react-extensions/interface';
import { ChargebeeEnabledString, chargebeeEnabledToString } from './helpers';
import { CalledKillSwitchString, useChargebeeContext } from './useChargebeeContext';

interface Overrides {
    plan?: PLANS | undefined;
    flow?: PaymentMethodFlows;
    amount?: number;
    cycle?: Cycle;
}

export interface PaymentsTelemetry {
    reportPaymentLoad: () => void;
    reportPaymentAttempt: (method: PaymentProcessorType | 'n/a', override?: Overrides) => void;
    reportPaymentSuccess: (method: PaymentProcessorType | 'n/a', override?: Overrides) => void;
    reportPaymentFailure: (method: PaymentProcessorType | 'n/a', override?: Overrides) => void;
}

type Dimensions = {
    flow: PaymentMethodFlows;
    plan: PLANS | ADDON_NAMES | 'n/a';
    calledKillSwitch: CalledKillSwitchString;
    chargebeeEnabled: ChargebeeEnabledString;
    system?: 'chargebee' | 'inhouse' | 'n/a';
    method?: PaymentProcessorType | 'n/a';
    /**
     * This must be a string like '1', '12', '24, etc.
     */
    cycle?: string;
};

type Values = {
    amount?: number;
};

export const usePaymentsTelemetry = ({
    apiOverride,
    plan,
    flow,
    amount,
    cycle,
}: {
    apiOverride?: Api;
    plan?: PLANS | ADDON_NAMES | undefined;
    flow: PaymentMethodFlows;
    amount?: number;
    cycle?: Cycle;
}): PaymentsTelemetry => {
    const defaultApi = useApi();
    const api = apiOverride ?? defaultApi;

    const chargebeeContext = useChargebeeContext();

    const formatDimensions = (
        method: PaymentProcessorType | 'n/a' | undefined,
        { flow: flowOverride, plan: planOverride, cycle: cycleOverride }: Overrides = {}
    ): Dimensions => {
        const reportedCycle = cycleOverride ?? cycle;
        const formattedCycle = reportedCycle ? reportedCycle.toString() : 'n/a';

        return {
            flow: flowOverride ?? flow,
            plan: planOverride ?? plan ?? 'n/a',
            calledKillSwitch: chargebeeContext.calledKillSwitch,
            chargebeeEnabled: chargebeeEnabledToString(chargebeeContext.enableChargebeeRef.current),
            system: getSystemByHookType(method),
            method,
            cycle: formattedCycle,
        };
    };

    const formatValues = ({ amount: amountOverride }: Overrides = {}): Values => {
        return { amount: amountOverride ?? amount };
    };

    const sendReport = (event: TelemetryPaymentsEvents, dimensions: Dimensions, values?: Values) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.paymentsFlow,
            event,
            dimensions,
            values,
        }).catch(noop);
    };

    const reportPaymentLoad = (overrides?: Overrides) => {
        sendReport(TelemetryPaymentsEvents.load_payment, formatDimensions(undefined, overrides));
    };

    const reportPaymentAttempt = (method: PaymentProcessorType | 'n/a', overrides?: Overrides) => {
        sendReport(
            TelemetryPaymentsEvents.payment_attempt,
            formatDimensions(method, overrides),
            formatValues(overrides)
        );
    };

    const reportPaymentSuccess = (method: PaymentProcessorType | 'n/a', overrides?: Overrides) => {
        sendReport(
            TelemetryPaymentsEvents.payment_success,
            formatDimensions(method, overrides),
            formatValues(overrides)
        );
    };

    const reportPaymentFailure = (method: PaymentProcessorType | 'n/a', overrides?: Overrides) => {
        sendReport(
            TelemetryPaymentsEvents.payment_failure,
            formatDimensions(method, overrides),
            formatValues(overrides)
        );
    };

    return {
        reportPaymentLoad,
        reportPaymentAttempt,
        reportPaymentSuccess,
        reportPaymentFailure,
    };
};
