import React from 'react';
import PropTypes from 'prop-types';

import Loader from '../loader/Loader';

const Content = ({ children, loading, className, onSubmit, onReset, autoComplete, ...rest }) => {
    if (loading) {
        return <Loader />;
    }
    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(event);
    };
    return (
        <form
            onSubmit={handleSubmit}
            onReset={onReset}
            autoComplete={autoComplete}
            className={`pm-modalContent ${className}`}
            {...rest}
        >
            {children}
        </form>
    );
};

Content.propTypes = {
    loading: PropTypes.bool,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onSubmit: PropTypes.func,
    onReset: PropTypes.func,
    autoComplete: PropTypes.string.isRequired
};

Content.defaultProps = {
    autoComplete: 'off',
    className: ''
};

export default Content;
