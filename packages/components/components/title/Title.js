import React from 'react';
import PropTypes from 'prop-types';

const Title = ({ children, ...rest }) => <h1 {...rest}>{children}</h1>;

Title.propTypes = {
    children: PropTypes.node.isRequired
};

export default Title;