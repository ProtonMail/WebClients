import React, { useState, useEffect } from 'react';
import { ErrorBoundary, GenericError, generateUID } from 'react-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useDriveResource } from './DriveResourceProvider';

interface Props extends RouteComponentProps {
    children: React.ReactNode;
}

const AppErrorBoundary = ({ children, location }: Props) => {
    const { setResource } = useDriveResource();
    const [state, setState] = useState({
        id: generateUID('error-boundary'),
        hasError: false
    });

    useEffect(() => {
        if (state.hasError) {
            setState({ id: generateUID('error-boundary'), hasError: false });
        }
    }, [location]);

    const handleError = () => {
        setState((prev) => ({ ...prev, hasError: true }));
        setResource(undefined);
    };

    return (
        <ErrorBoundary
            key={state.id}
            onError={handleError}
            component={
                <div className="p2 main-area">
                    <GenericError />
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
};

export default withRouter(AppErrorBoundary);
