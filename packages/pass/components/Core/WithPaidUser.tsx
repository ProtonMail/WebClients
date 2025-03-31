import type { ComponentType, FC } from 'react';

import { useMatchUser } from '@proton/pass/hooks/useMatchUser';

export const WithPaidUser = <P extends object>(Component: ComponentType<P>): FC<P> => {
    const WrappedComponent: FC<P> = (props) => {
        const fileAttachmentsDisabled = useMatchUser({ paid: false, planDisplayName: ['Pass Essentials'] });
        return fileAttachmentsDisabled ? null : <Component {...props} />;
    };

    WrappedComponent.displayName = `WithPaidUser<${Component.displayName ?? 'Component'}>`;

    return WrappedComponent;
};
