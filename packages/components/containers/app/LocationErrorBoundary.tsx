import * as React from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

interface Props {
    children: React.ReactNode;
    component?: React.ReactNode;
}

const LocationErrorBoundary = ({ children, component }: Props) => {
    const location = useLocation();
    return (
        <ErrorBoundary resetKey={location.key} component={component}>
            {children}
        </ErrorBoundary>
    );
};

export default LocationErrorBoundary;
