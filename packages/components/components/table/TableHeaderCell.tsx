import { ReactNode, ThHTMLAttributes } from 'react';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { Icon } from '../icon';
import { Loader } from '../loader';

import './TableHeaderCell.scss';

interface Props extends ThHTMLAttributes<HTMLTableCellElement> {
    children?: ReactNode;
    direction?: SORT_DIRECTION;
    isLoading?: boolean;
    onSort?: () => void;
}

const TableHeaderCell = ({ children, direction, isLoading, onSort, ...rest }: Props) => {
    const content = onSort ? (
        <div className="flex-nowrap inline-flex-vcenter cursor-pointer table-header-cell-hover" onClick={onSort}>
            <span className="mr0-25">{children}</span>
            {direction && (
                <Icon
                    name="arrow-up"
                    size={16}
                    className={`mr0-25 flex-item-noshrink ${direction === SORT_DIRECTION.ASC ? '' : 'rotateX-180'}`}
                />
            )}
            {isLoading && <Loader className="flex flex-item-noshrink" />}
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
