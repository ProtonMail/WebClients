import React from 'react';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { Icon } from '../icon';

interface Props extends React.ThHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
    direction?: SORT_DIRECTION;
    onSort?: () => void;
}

const TableHeaderCell = ({ children, direction, onSort, ...rest }: Props) => {
    const content = onSort ? (
        <div className="flex-nowrap inline-flex-vcenter cursor-pointer" onClick={onSort}>
            <span className="mr0-25">{children}</span>
            {direction && (
                <Icon
                    name="caret"
                    size={12}
                    className={`flex-item-noshrink ${direction === SORT_DIRECTION.DESC ? '' : 'rotateX-180'}`}
                />
            )}
        </div>
    ) : (
        children
    );

    return (
        <th scope="col" {...rest}>
            {content}
        </th>
    );
};

export default TableHeaderCell;
