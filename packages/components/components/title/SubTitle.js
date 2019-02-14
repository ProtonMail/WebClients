import React from 'react';
import PropTypes from 'prop-types';

const SubTitle = ({ children, ...rest }) => <h2 {...rest}>{children}</h2>;

SubTitle.propTypes = {
    children: PropTypes.node.isRequired
};

export default SubTitle;