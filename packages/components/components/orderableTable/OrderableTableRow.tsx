import { ReactNode } from 'react';
import Icon from '../icon/Icon';
import { TableRow } from '../table';
import { OrderableElement, OrderableHandle } from '../orderable';

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
                            <Icon className="mtauto mbauto cursor-row-resize" name="align-justify" />
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
