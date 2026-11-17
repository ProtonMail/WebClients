import { TelemetryAccountImportFlowEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, duration, number, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import type { BYOE_CLAIM_PROTON_ADDRESS_SOURCE } from '../constants';

/**
 * The claim steps of the account import flow (`accountImportFlow` group). The rest of the flow is defined in
 * `@proton/activation/src/telemetry/accountImportFlow`; the dimensions sent here must stay in its lists.
 */
const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.accountImportFlow,
    values: { activeMs: duration(), timestampMs: number() },
} as const;

const flowSpec = allowed(['byoe']);
const stepSpec = allowed(['claim_proton_address']);
// Free list on the telemetry side (`top_values`): a new source needs no change to the telemetry definition
const sourceSpec = topValues();

const claimProtonAddressInteracted = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepInteracted,
    dimensions: { flow: flowSpec, step: stepSpec, action: allowed(['claim']), source: sourceSpec },
});

const claimProtonAddressCompleted = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepCompleted,
    dimensions: { flow: flowSpec, step: stepSpec, source: sourceSpec },
});

const withTimestamp = () => ({ values: { timestampMs: Date.now() } });

/**
 * A BYOE-only user chose to create a Proton address from `source`, before the creation. Standalone event, there is no
 * running flow, so no `activeMs`.
 */
export const trackAccountImportClaimProtonAddressClicked = (source: BYOE_CLAIM_PROTON_ADDRESS_SOURCE) => {
    tracker.emit(
        claimProtonAddressInteracted,
        { dimensions: { flow: 'byoe', step: 'claim_proton_address', action: 'claim', source }, ...withTimestamp() },
        { delay: false, flushImmediately: true }
    );
};

/** The Proton address of a BYOE-only user was created from `source` */
export const trackAccountImportClaimProtonAddressCompleted = (source: BYOE_CLAIM_PROTON_ADDRESS_SOURCE) => {
    tracker.emit(
        claimProtonAddressCompleted,
        { dimensions: { flow: 'byoe', step: 'claim_proton_address', source }, ...withTimestamp() },
        { delay: false, flushImmediately: true }
    );
};
