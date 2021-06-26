import React from 'react';

import { classnames } from '../../helpers';
import { Box, PolymorphicComponent } from '../../helpers/react-polymorphic-box';
import { Href } from '../link';

interface DropdownMenuLinkProps {}

const defaultElement = Href;

const DropdownMenuLink: PolymorphicComponent<DropdownMenuLinkProps, typeof defaultElement> = ({
    className = '',
    children,
    ...rest
}) => {
    return (
        <Box
            as={defaultElement}
            {...rest}
            className={classnames(['dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration', className])}
        >
            {children}
        </Box>
    );
};

export default DropdownMenuLink;
