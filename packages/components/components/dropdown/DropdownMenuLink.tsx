import { ElementType } from 'react';
import { classnames } from '../../helpers';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import { Href } from '../link';

interface DropdownMenuLinkOwnProps {}

export type DropdownMenuLinkProps<E extends ElementType> = PolymorphicComponentProps<E, DropdownMenuLinkOwnProps>;

const defaultElement = Href;

const DropdownMenuLink = <E extends ElementType = typeof defaultElement>({
    className = '',
    children,
    ...rest
}: DropdownMenuLinkProps<E>) => {
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
