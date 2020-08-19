import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import {
    ErrorBoundary,
    GenericError,
    generateUID,
    InternalServerError,
    NotFoundError,
    AccessDeniedError,
    PrivateMainArea,
} from 'react-components';
import { ApiError } from 'proton-shared/lib/fetch/ApiError';

import { useDriveActiveFolder } from './Drive/DriveFolderProvider';

interface Props {
    children: React.ReactNode;
}

const AppErrorBoundary = ({ children }: Props) => {
    const location = useLocation();
    const { setFolder } = useDriveActiveFolder();
    const [state, setState] = useState<{ id: string; error?: Error }>({
        id: generateUID('error-boundary'),
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
        const { error } = state;
        if (!error) {
            return null;
        }

        if (error instanceof ApiError) {
            if (error.status === 500) {
                return <InternalServerError />;
            }
            if (error.status === 404) {
                return <NotFoundError />;
            }
            if (error.status === 403) {
                return <AccessDeniedError />;
            }
        }

        return <GenericError />;
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

export default AppErrorBoundary;
