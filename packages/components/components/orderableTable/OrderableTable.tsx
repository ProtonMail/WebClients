import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { SortableContainerProps } from 'react-sortable-hoc';

import Table from '@proton/components/components/table/Table';
import { isModalOpen } from '@proton/shared/lib/busy';
import clsx from '@proton/utils/clsx';

import OrderableContainer from '../orderable/OrderableContainer';

import './OrderableTable.scss';

interface Props extends SortableContainerProps {
    className?: string;
    helperClassname?: string;
    children?: ReactNode;
    caption?: string;
    inModal?: boolean;
}

const OrderableTable = ({ children = [], className = '', helperClassname, caption, ...props }: Props) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inModalRef = useRef(false);

    return (
        <div ref={wrapperRef}>
            <OrderableContainer
                useDragHandle
                helperContainer={() => {
                    inModalRef.current = isModalOpen();
                    if (inModalRef.current) {
                        return document.body;
                    } else {
                        const tbodyElement = wrapperRef.current?.querySelector('tbody');
                        return tbodyElement || document.body;
                    }
                }}
                onSortStart={({ node, helper }) => {
                    helper.classList.add('orderableHelper');
                    if (inModalRef.current) {
                        helper.classList.add('orderableHelper--inModal');
                    }
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
