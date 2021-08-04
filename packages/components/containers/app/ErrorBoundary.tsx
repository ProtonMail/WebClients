import { ErrorInfo } from 'react';
import * as React from 'react';

import { traceError } from '@proton/shared/lib/helpers/sentry';
import GenericError from '../error/GenericError';

interface Props {
    resetKey?: string;
    component?: React.ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

const initialState = {
    hasError: false,
};

// https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries
class ErrorBoundary extends React.Component<React.PropsWithRef<React.PropsWithChildren<Props>>, State> {
    constructor(props: Props) {
        super(props);
        this.state = initialState;
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidUpdate(prevProps: Props) {
        const { props, state } = this;
        if (state.hasError && prevProps.resetKey !== props.resetKey) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(initialState);
        }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        const { props } = this;
        props.onError?.(error, info);
        traceError(error);
        console.error(error);
    }

    render() {
        const { state, props } = this;
        if (!state.hasError) {
            return props.children;
        }
        return props.component || <GenericError className="pt2" />;
    }
}

export default ErrorBoundary;
