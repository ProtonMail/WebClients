import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { ErrorBoundary, GenericError, generateUID } from 'react-components';
import { InitStatusCodes } from '../interfaces/volume';
import NoAccessContainer from '../containers/NoAccessContainer/NoAccessContainer';

interface Props {
    children: React.ReactNode;
}

const DriveErrorBoundary = ({ children }: Props) => {
    const location = useLocation();
    const [state, setState] = useState<{ id: string; error?: any }>({
        id: generateUID('error-boundary'),
    });

    useEffect(() => {
        if (state.error) {
            setState({ id: generateUID('error-boundary') });
        }
    }, [location]);

    const handleError = (error: Error) => {
        setState((prev) => ({ ...prev, error }));
    };

    const renderError = () => {
        const { error } = state;

        if (!error) {
            return null;
        }

        if (error?.data?.Code === InitStatusCodes.NoAccess) {
            return <NoAccessContainer />;
        }

        return <GenericError className="pt2 h100v" />;
    };

    return (
        <ErrorBoundary key={state.id} onError={handleError} component={renderError()}>
            {children}
        </ErrorBoundary>
    );
};

export default DriveErrorBoundary;
