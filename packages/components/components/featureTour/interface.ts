import type { JSX, ReactNode } from 'react';

import type { FeatureTourStepId } from '@proton/account/featuresTour/interface';
import type { SharedStore } from '@proton/redux-shared-store/sharedStore';

/**
 * Props passed to each step component
 */
export interface FeatureTourStepProps {
    onNext: () => void;
    children?: ReactNode;
    bullets: JSX.Element;
}

export type FeatureTourStep = {
    id: FeatureTourStepId;
    isActive: boolean;
};

export type ShouldDisplayTourStep = (
    dispatch: SharedStore['dispatch']
) => Promise<{ canDisplay: boolean; preloadUrls?: string[] }>;
