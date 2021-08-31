import { ReactNode } from 'react';
import { TableHeader } from '../table';
import './OrderableTableHeader.scss';
import { classnames } from '../../helpers';

interface Props {
    cells?: ReactNode[];
    className?: string;
    children?: ReactNode;
}

const OrderableTableHeader = ({ cells = [], className = '', children = null, ...rest }: Props) => (
    <TableHeader
        cells={[
            null, // column for icon
            ...cells,
        ]}
        className={classnames(['orderableTableHeader', className])}
        {...rest}
    >
        {children}
    </TableHeader>
);

export default OrderableTableHeader;
