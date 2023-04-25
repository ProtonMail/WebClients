import { ReactNode } from 'react';

import Icon from '../icon/Icon';
import { OrderableElement, OrderableHandle } from '../orderable';
import { TableRow } from '../table';

interface Props {
    index: number;
    className?: string;
    cells?: ReactNode[];
    disableSort?: boolean;
}

const OrderableTableRow = ({ index, cells = [], className, disableSort, ...rest }: Props) => {
    if (disableSort) {
        return <TableRow cells={['', ...cells]} className={className} {...rest} />;
    }

    return (
        <OrderableElement index={index}>
            <TableRow
                cells={[
                    <OrderableHandle key="icon">
                        <span className="flex" data-testid="table:order-icon">
                            <Icon className="my-auto cursor-row-resize" name="text-align-justify" />
                        </span>
                    </OrderableHandle>,
                    ...cells,
                ]}
                className={className}
                {...rest}
            />
        </OrderableElement>
    );
};

export default OrderableTableRow;
