import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { classnames } from '../../helpers/component';

const Content = ({ children, className = '', onSubmit = noop, onReset = noop, autoComplete = 'off', ...rest }) => {
    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(event);
    };
    return (
        <form
            onSubmit={handleSubmit}
            onReset={onReset}
            autoComplete={autoComplete}
            className={classnames(['pm-modalContent', className])}
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
    autoComplete: PropTypes.string
};

export default Content;
