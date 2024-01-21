import { ComponentType, ReactNode } from 'react';
import { SortableContainer, SortableContainerProps } from 'react-sortable-hoc';

interface Props extends SortableContainerProps {
    children: ReactNode;
}

const OrderableContainer = SortableContainer(({ children }: Props) => children) as ComponentType<Props>;

export default OrderableContainer;
