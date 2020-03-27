import React, { useState, useEffect } from 'react';
import {
    ErrorBoundary,
    GenericError,
    generateUID,
    InternalServerError,
    NotFoundError,
    AccessDeniedError
} from 'react-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useDriveResource } from './Drive/DriveResourceProvider';

interface ApiError extends Error {
    response: Response;
}

interface Props extends RouteComponentProps {
    children: React.ReactNode;
}

const AppErrorBoundary = ({ children, location }: Props) => {
    const { setResource } = useDriveResource();
    const [state, setState] = useState<{ id: string; error?: Error }>({
        id: generateUID('error-boundary')
    });

    useEffect(() => {
        if (state.error) {
            setState({ id: generateUID('error-boundary') });
        }
    }, [location]);

    const handleError = (error: Error) => {
        setState((prev) => ({ ...prev, error }));
        setResource(undefined);
    };

    const renderError = () => {
        if (!state.error) {
            return null;
        }

        if (state.error.name !== 'StatusCodeError') {
            return <GenericError />;
        }

        const response = (state.error as ApiError).response;

        if (response.status === 500) {
            return <InternalServerError />;
        } else if (response.status === 404) {
            return <NotFoundError />;
        } else if (response.status === 403) {
            return <AccessDeniedError />;
        }
    };

    return (
        <ErrorBoundary
            key={state.id}
            onError={handleError}
            component={<div className="p2 main-area">{renderError()}</div>}
        >
            {children}
        </ErrorBoundary>
    );
};

export default withRouter(AppErrorBoundary);
