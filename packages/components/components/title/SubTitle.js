import React from 'react';
import PropTypes from 'prop-types';

const SubTitle = ({ children, ...rest }) => <h1 {...rest}>{children}</h1>;

SubTitle.propTypes = {
    children: PropTypes.node.isRequired
};

export default SubTitle;