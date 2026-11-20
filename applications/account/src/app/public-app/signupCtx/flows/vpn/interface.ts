import type { CYCLE } from '@proton/payments/core/constants';

import type { SubscriptionData } from '../../../signup/interfaces';
import type { BaseMeasure, Steps } from '../../../single-signup-v2/interface';
import type { TelemetryMeasurementData } from './measure';

export type Measure = BaseMeasure<TelemetryMeasurementData>;

export interface CycleData {
    cycles: CYCLE[];
    upsellCycle: CYCLE;
}

export type VPNSignupMode = 'signup' | 'pricing' | 'vpn-pass-promotion';

/** The signup's own progress: the prices and the selection live in the payments context. */
export interface VPNSignupModel {
    step: Steps;
    /** What the user signed up with, once submitted */
    subscriptionData: SubscriptionData | undefined;
    /** The reserved Bitcoin account pays once its transaction is confirmed */
    signupTokenMode?: boolean;
    /** The user is created, on the free plan for Bitcoin. If its setup fails, the form only retries the setup. */
    reservedUser?: boolean;
}
