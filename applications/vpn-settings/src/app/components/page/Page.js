import React from 'react';
import PropTypes from 'prop-types';

import Main from './Main';
import Title from './Title';

const Page = ({ title, children }) => {
    return (
        <Main>
            <Title>{title}</Title>
            <div className="container-section-sticky">{children}</div>
        </Main>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};

export default Page;
