import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Content = ({ children, className, onSubmit, ...rest }) => {
    return <form onSubmit={onSubmit} className={getClasses('pm-modalContent', className)} {...rest}>{children}</form>;
};

Content.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onSubmit: PropTypes.func
};

export default Content;