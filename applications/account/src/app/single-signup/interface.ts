import { type CYCLE } from '@proton/payments';

import type { BaseMeasure, SignupModelV2 } from '../single-signup-v2/interface';
import type { TelemetryMeasurementData } from './measure';

export type Measure = BaseMeasure<TelemetryMeasurementData>;

export interface CycleData {
    cycles: CYCLE[];
    upsellCycle: CYCLE;
}

export type VPNSignupMode = 'signup' | 'pricing' | 'vpn-pass-promotion';

export interface VPNSignupModel extends SignupModelV2 {
    cycleData: CycleData;
    signupType: 'vpn2024' | 'default';
    mode: VPNSignupMode;
}
