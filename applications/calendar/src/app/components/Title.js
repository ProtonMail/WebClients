import React from 'react';
import PropTypes from 'prop-types';

const Title = ({ children }) => {
    return <h1 className="sticky-title sticky-title--onTop">{children}</h1>;
};

Title.propTypes = {
    children: PropTypes.node.isRequired
};

export default Title;
