import React, { useState, useEffect } from 'react';
import { ErrorBoundary, GenericError, generateUID, IllustrationPlaceholder } from 'react-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { c } from 'ttag';
import internalServerErrorSvg from 'design-system/assets/img/shared/internal-server-error.svg';
import notFoundErrorSvg from 'design-system/assets/img/shared/page-not-found.svg';
import noAccessErrorSvg from 'design-system/assets/img/shared/no-access-page.svg';
import { useDriveResource } from './DriveResourceProvider';

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
            return (
                <IllustrationPlaceholder
                    title={c('Error message').t`Internal server error`}
                    text={
                        <>
                            <span>{c('Error message').t`Brace yourself till we get the error fixed.`}</span>
                            <span>{c('Error message').t`You may also refresh the page or try again later.`}</span>
                        </>
                    }
                    url={internalServerErrorSvg}
                />
            );
        } else if (response.status === 404) {
            return <IllustrationPlaceholder title={c('Error message').t`Not found`} url={notFoundErrorSvg} />;
        } else if (response.status === 403) {
            return <IllustrationPlaceholder title={c('Error message').t`Access denied`} url={noAccessErrorSvg} />;
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
