import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { SortableContainerProps } from 'react-sortable-hoc';

import clsx from '@proton/utils/clsx';

import OrderableContainer from '../orderable/OrderableContainer';
import { Table } from '../table';

import './OrderableTable.scss';

interface Props extends SortableContainerProps {
    className?: string;
    helperClassname?: string;
    children?: ReactNode;
    caption?: string;
}

const OrderableTable = ({ children = [], className = '', helperClassname, caption, ...props }: Props) => {
    let wrapperRef = useRef<HTMLDivElement | null>(null);

    return (
        <div ref={wrapperRef}>
            <OrderableContainer
                helperClass={clsx(['orderableHelper'])}
                useDragHandle
                helperContainer={() => {
                    const tbodyElement = wrapperRef.current?.querySelector('tbody');
                    return tbodyElement || document.body;
                }}
                onSortStart={({ node, helper }) => {
                    // Set the width of each cell in the helper to match the corresponding cell in the node
                    node.childNodes.forEach((child, index) => {
                        if (child instanceof HTMLElement) {
                            const helperChild = helper.childNodes[index];

                            if (helperChild instanceof HTMLElement) {
                                helperChild.style.width = `${child.offsetWidth}px`;
                            }
                        }
                    });
                }}
                {...props}
            >
                <Table caption={caption} responsive="cards" className={clsx(['orderableTable', className])}>
                    {children}
                </Table>
            </OrderableContainer>
        </div>
    );
};

export default OrderableTable;
