import { PLANS } from '@proton/shared/lib/constants';

export interface PlanLabel {
    label: string;
    key: PLANS | 'free';
}

export interface Feature {
    name: string;
    label: React.ReactNode;
    tooltip?: string;
    free: React.ReactNode;
}

export interface DriveFeature extends Feature {
    [PLANS.PLUS]: React.ReactNode;
    [PLANS.PROFESSIONAL]: React.ReactNode;
    [PLANS.VISIONARY]: React.ReactNode;
}
export interface CalendarFeature extends Feature {
    [PLANS.PLUS]: React.ReactNode;
    [PLANS.PROFESSIONAL]: React.ReactNode;
    [PLANS.VISIONARY]: React.ReactNode;
}

export interface MailFeature extends Feature {
    [PLANS.PLUS]: React.ReactNode;
    [PLANS.PROFESSIONAL]: React.ReactNode;
    [PLANS.VISIONARY]: React.ReactNode;
}

export interface VPNFeature extends Feature {
    [PLANS.VPNBASIC]: React.ReactNode;
    [PLANS.VPNPLUS]: React.ReactNode;
    [PLANS.VISIONARY]: React.ReactNode;
}
