import type { ComponentType, FC } from 'react';

import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import type { PassFeature } from '@proton/pass/types/api/features';

export const WithFeatureFlag = <P extends object>(Component: ComponentType<P>, feature: PassFeature): FC<P> => {
    const WrappedComponent: FC<P> = (props) => {
        const enabled = useFeatureFlag(feature);
        return enabled ? <Component {...props} /> : null;
    };

    WrappedComponent.displayName = `WithFeatureFlag<${Component.displayName ?? 'Component'}>`;

    return WrappedComponent;
};
