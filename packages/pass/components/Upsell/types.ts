import type { ReactNode } from 'react';

import type { IconComponent } from '@proton/icons/component';

type FeatureKeys = 'individuals' | 'business';

export type FeatureType = {
    icon?: IconComponent | ReactNode;
    label: string;
};

export type PlanFeaturesType = {
    [key in FeatureKeys]: FeatureType[];
};
