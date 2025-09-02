import type { ReactNode } from 'react';
import type { Location } from 'react-router-dom-v5-compat';

import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';

interface LocationErrorBoundaryProps {
    children: ReactNode;
    component?: ReactNode;
    location: Location;
}

const LocationErrorBoundary = ({ children, component, location }: LocationErrorBoundaryProps) => {
    return (
        <ErrorBoundary resetKey={location.key} component={component}>
            {children}
        </ErrorBoundary>
    );
};

export default LocationErrorBoundary;
