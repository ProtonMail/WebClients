import React, { useState, useEffect } from 'react';
import {
    ErrorBoundary,
    GenericError,
    generateUID,
    InternalServerError,
    NotFoundError,
    AccessDeniedError,
    PrivateMainArea
} from 'react-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useDriveActiveFolder } from './Drive/DriveFolderProvider';

interface ApiError extends Error {
    response: Response;
}

interface Props extends RouteComponentProps {
    children: React.ReactNode;
}

const AppErrorBoundary = ({ children, location }: Props) => {
    const { setFolder } = useDriveActiveFolder();
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
        setFolder(undefined);
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
            component={<PrivateMainArea>{renderError()}</PrivateMainArea>}
        >
            {children}
        </ErrorBoundary>
    );
};

export default withRouter(AppErrorBoundary);
