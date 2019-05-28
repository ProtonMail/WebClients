import React from 'react';
import { c } from 'ttag';

// https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }
        const error = this.state.error ? this.state.error.toString() : undefined;
        return (
            <>
                <h1>{c('Title').t`Something went wrong.`}</h1>
                <span>{error}</span>
            </>
        );
    }
}

export default ErrorBoundary;
