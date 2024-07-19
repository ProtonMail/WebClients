import type { ErrorInfo, PropsWithChildren, PropsWithRef, ReactNode } from 'react';
import { Component } from 'react';

import type { SentryInitiative } from '@proton/shared/lib/helpers/sentry';
import { traceError, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import GenericError from '../error/GenericError';

interface Props {
    className?: string;
    big?: boolean;
    resetKey?: string;
    component?: ReactNode;
    renderFunction?: (error: Error | undefined) => ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
    initiative?: SentryInitiative;
}

interface State {
    hasError: boolean;
    error?: Error;
}

const initialState = {
    hasError: false,
};

// https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries
class ErrorBoundary extends Component<PropsWithRef<PropsWithChildren<Props>>, State> {
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
        if (props.initiative) {
            traceInitiativeError(props.initiative, error);
        } else {
            traceError(error);
        }
        console.error(error);
    }

    render() {
        const { state, props } = this;
        if (!state.hasError) {
            return props.children;
        }
        if (props.component || props.component === null) {
            return props.component;
        }
        if (props.renderFunction) {
            return props.renderFunction(state.error);
        }

        return <GenericError className={props.className} big={props.big} />;
    }
}

export default ErrorBoundary;
