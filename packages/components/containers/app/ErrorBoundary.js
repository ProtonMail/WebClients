import React from 'react';
import { GenericError } from 'react-components';
import { PropTypes } from 'prop-types';

import { traceError } from 'proton-shared/lib/helpers/sentry';

// https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        this.props.onError && this.props.onError(error, info);
        traceError(error);
        console.error(error);
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }
        return <GenericError className="pt2" />;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node,
    onError: PropTypes.func
};

export default ErrorBoundary;
