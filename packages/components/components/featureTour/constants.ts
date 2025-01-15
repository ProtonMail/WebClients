import type { ComponentType } from 'react';

import type { FeatureTourStepId, FeatureTourStepProps, ShouldDisplayTourStep } from './interface';
import AutoDeleteTourStep, { shouldDisplayAutoDeleteTourStep } from './steps/AutoDeleteTourStep';
import DarkWebMonitoringTourStep, { shouldDisplayDarkWebMonitoringTourStep } from './steps/DarkWebMonitoringTourStep';
import DesktopAppTourStep, { shouldDisplayDesktopAppTourStep } from './steps/DesktopAppTourStep';
import DuoAccountTourStep, { shouldDisplayDuoAccountTourStep } from './steps/DuoAccountTourStep';
import FamilyAccountTourStep, { shouldDisplayFamilyAccountTourStep } from './steps/FamilyAccountTourStep';
import MobileAppTourStep, { shouldDisplayMobileAppTourStep } from './steps/MobileAppTourStep';
import OtherFeaturesTourStep, { shouldDisplayOtherFeaturesTourStep } from './steps/OtherFeaturesTourStep';
import ProtonDriveTourStep, { shouldDisplayProtonDriveTourStep } from './steps/ProtonDriveTourStep';
import ProtonPassTourStep, { shouldDisplayProtonPassTourStep } from './steps/ProtonPassTourStep';
import ProtonVPNTourStep, { shouldDisplayProtonVPNTourStep } from './steps/ProtonVPNTourStep';
import ShortDomainTourStep, { shouldDisplayShortDomainTourStep } from './steps/ShortDomainTourStep';

export const FEATURE_TOUR_STEPS: FeatureTourStepId[] = [
    'short-domain',
    'auto-delete',
    'dark-web-monitoring',
    'duo-account',
    'family-account',
    'desktop-app',
    'mobile-app',
    'proton-vpn',
    'proton-pass',
    'proton-drive',
    'other-features',
];

export const FEATURE_TOUR_STEPS_MAP: Record<
    FeatureTourStepId,
    { component: ComponentType<FeatureTourStepProps>; shouldDisplay: ShouldDisplayTourStep }
> = {
    'short-domain': { component: ShortDomainTourStep, shouldDisplay: shouldDisplayShortDomainTourStep },
    'auto-delete': { component: AutoDeleteTourStep, shouldDisplay: shouldDisplayAutoDeleteTourStep },
    'dark-web-monitoring': {
        component: DarkWebMonitoringTourStep,
        shouldDisplay: shouldDisplayDarkWebMonitoringTourStep,
    },
    'duo-account': { component: DuoAccountTourStep, shouldDisplay: shouldDisplayDuoAccountTourStep },
    'family-account': { component: FamilyAccountTourStep, shouldDisplay: shouldDisplayFamilyAccountTourStep },
    'desktop-app': { component: DesktopAppTourStep, shouldDisplay: shouldDisplayDesktopAppTourStep },
    'mobile-app': { component: MobileAppTourStep, shouldDisplay: shouldDisplayMobileAppTourStep },
    'proton-vpn': { component: ProtonVPNTourStep, shouldDisplay: shouldDisplayProtonVPNTourStep },
    'proton-pass': { component: ProtonPassTourStep, shouldDisplay: shouldDisplayProtonPassTourStep },
    'proton-drive': { component: ProtonDriveTourStep, shouldDisplay: shouldDisplayProtonDriveTourStep },
    'other-features': { component: OtherFeaturesTourStep, shouldDisplay: shouldDisplayOtherFeaturesTourStep },
} as const;
