import type { ReactNode } from 'react';

import type { SharedStore } from '@proton/redux-shared-store/sharedStore';

/**
 * Props passed to each step component
 */
export interface FeatureTourStepProps {
    onNext: () => void;
    children?: ReactNode;
    isActive: boolean;
    bullets: JSX.Element;
}

export type FeatureTourStep = {
    id: FeatureTourStepId;
    isActive: boolean;
};

export type FeatureTourStepId =
    | 'short-domain'
    | 'auto-delete'
    | 'dark-web-monitoring'
    | 'duo-account'
    | 'family-account'
    | 'desktop-app'
    | 'mobile-app'
    | 'proton-vpn'
    | 'proton-pass'
    | 'proton-drive'
    | 'other-features';

export type ShouldDisplayTourStep = (dispatch: SharedStore['dispatch']) => Promise<boolean>;
