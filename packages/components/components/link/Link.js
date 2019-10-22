import React from 'react';
import PropType from 'prop-types';
import { Link as ReactRouterLink } from 'react-router-dom';

import Href from './Href';

const Link = ({ to, external = false, children, ...rest }) => {
    if (external) {
        return (
            <Href url={to} target="_self" {...rest}>
                {children}
            </Href>
        );
    }

    return (
        <ReactRouterLink to={to} {...rest}>
            {children}
        </ReactRouterLink>
    );
};

Link.propTypes = {
    to: PropType.string.isRequired,
    external: PropType.bool,
    children: PropType.node.isRequired
};

export default Link;
