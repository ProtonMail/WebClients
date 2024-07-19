import type { ComponentType, ReactNode, Ref } from 'react';
import type { SortableElementProps } from 'react-sortable-hoc';
import { SortableElement } from 'react-sortable-hoc';

interface Props extends SortableElementProps {
    children?: ReactNode;
    ref?: Ref<any>;
}

const OrderableElement = SortableElement(({ children }: Props) => children) as unknown as ComponentType<Props>;

export default OrderableElement;
