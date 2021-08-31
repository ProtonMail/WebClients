import { ReactNode } from 'react';
import { PLANS } from '@proton/shared/lib/constants';

export interface PlanLabel {
    label: string;
    key: PLANS | 'free';
}

export interface Feature {
    name: string;
    label: ReactNode;
    tooltip?: string;
    free: ReactNode;
}

export interface DriveFeature extends Feature {
    [PLANS.PLUS]: ReactNode;
    [PLANS.PROFESSIONAL]: ReactNode;
    [PLANS.VISIONARY]: ReactNode;
}
export interface CalendarFeature extends Feature {
    [PLANS.PLUS]: ReactNode;
    [PLANS.PROFESSIONAL]: ReactNode;
    [PLANS.VISIONARY]: ReactNode;
}

export interface MailFeature extends Feature {
    [PLANS.PLUS]: ReactNode;
    [PLANS.PROFESSIONAL]: ReactNode;
    [PLANS.VISIONARY]: ReactNode;
}

export interface VPNFeature extends Feature {
    [PLANS.VPNBASIC]: ReactNode;
    [PLANS.VPNPLUS]: ReactNode;
    [PLANS.VISIONARY]: ReactNode;
}
