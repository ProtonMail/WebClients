import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Content = ({ children, className, onSubmit, onReset, autoComplete, ...rest }) => {
    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(event);
    };
    return (
        <form
            onSubmit={handleSubmit}
            onReset={onReset}
            autoComplete={autoComplete}
            className={getClasses('pm-modalContent', className)}
            {...rest}
        >
            {children}
        </form>
    );
};

Content.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onSubmit: PropTypes.func,
    onReset: PropTypes.func,
    autoComplete: PropTypes.string.isRequired
};

Content.defaultProps = {
    autoComplete: 'off'
};

export default Content;
