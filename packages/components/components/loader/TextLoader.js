import React from 'react';
import PropTypes from 'prop-types';

import { classnames } from '../../helpers/component';

const TextLoader = ({ children, className }) => {
    return <p className={classnames(['atomLoader-text', className])}>{children}</p>;
};

TextLoader.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default TextLoader;
