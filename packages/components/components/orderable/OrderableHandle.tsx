import type { ComponentType, ReactNode } from 'react';
import { SortableHandle } from 'react-sortable-hoc';

interface Props {
    children?: ReactNode;
}

const OrderableHandle = SortableHandle(({ children }: Props): ReactNode => children) as ComponentType<Props>;

export default OrderableHandle;
