import type { ComponentType, FC, ReactNode } from 'react';

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

type Props = { feature: PassFeature; children: ReactNode | ((enabled: boolean) => ReactNode) };

export const FeatureFlag: FC<Props> = ({ feature, children }) => {
    const enabled = useFeatureFlag(feature);
    if (children instanceof Function) return children(enabled);
    return enabled ? children : null;
};
