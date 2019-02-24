import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Content = ({ children, className, onSubmit, onReset, ...rest }) => {
    return <form
        onSubmit={onSubmit}
        onReset={onReset}
        className={getClasses('pm-modalContent', className)}
        {...rest}>{children}</form>;
};

Content.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onSubmit: PropTypes.func,
    onReset: PropTypes.func
};

export default Content;