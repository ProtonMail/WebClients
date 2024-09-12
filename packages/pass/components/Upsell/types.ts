import type { ReactNode } from 'react';

import type { IconName } from '@proton/components';

type FeatureKeys = 'individuals' | 'business';

export type FeatureType = {
    icon?: IconName | (() => ReactNode);
    label: string;
};

export type PlanFeaturesType = {
    [key in FeatureKeys]: FeatureType[];
};
