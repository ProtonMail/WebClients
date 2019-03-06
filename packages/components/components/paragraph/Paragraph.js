import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Paragraph = ({ className, children }) => {
    return <div className={getClasses('pt1 pb1', className)}>{children}</div>;
};

Paragraph.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

Paragraph.defaultProps = {
    className: ''
};

export default Paragraph;
