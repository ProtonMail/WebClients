import React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';

import Href, { Props as HrefProps } from './Href';

export interface Props extends HrefProps {
    to: string;
    external?: boolean;
}

const Link = ({ to, external, target = '_self', children, ...rest }: Props) => {
    if (external) {
        return (
            <Href url={to} target={target} {...rest}>
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

export default Link;
