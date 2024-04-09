import { CYCLE } from '@proton/shared/lib/constants';

import { BaseMeasure, SignupModelV2 } from '../single-signup-v2/interface';
import type { TelemetryMeasurementData } from './measure';

export type Measure = BaseMeasure<TelemetryMeasurementData>;

export interface CycleData {
    cycles: CYCLE[];
    upsellCycle: CYCLE;
}

export interface VPNSignupModel extends SignupModelV2 {
    cycleData: CycleData;
    signupType: 'vpn2024' | 'default';
}
