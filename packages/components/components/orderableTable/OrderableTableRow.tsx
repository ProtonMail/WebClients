import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import type Cell from '@proton/components/components/table/Cell';
import TableRow from '@proton/components/components/table/TableRow';

import { OrderableElement, OrderableHandle } from '../orderable';

interface Props {
    index: number;
    className?: string;
    cells?: (Cell | ReactNode)[];
    disableSort?: boolean;
}

const OrderableTableRow = ({ index, cells = [], className, disableSort, ...rest }: Props, ref: Ref<any>) => {
    if (disableSort) {
        return <TableRow cells={['', ...cells]} className={className} {...rest} />;
    }

    return (
        <OrderableElement index={index} ref={ref}>
            <TableRow
                cells={[
                    <OrderableHandle key="icon">
                        <span className="flex" data-testid="table:order-icon">
                            <Icon className="my-auto cursor-grab color-hint" name="dots" />
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

export default forwardRef(OrderableTableRow);
