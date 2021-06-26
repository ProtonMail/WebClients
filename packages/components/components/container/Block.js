import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers';

const Block = ({ children, className = '' }) => {
    return <div className={classnames(['mb1', className])}>{children}</div>;
};

Block.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Block;
