import React from 'react';
import PropTypes from 'prop-types';
import { getClasses } from '../../helpers/component';

const Block = ({ children, className }) => {
    return <div className={getClasses('mb1', className)}>{children}</div>;
};

Block.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Block;