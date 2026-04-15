import type { ReactNode, ThHTMLAttributes } from 'react';

import Loader from '@proton/components/components/loader/Loader';
import { IcArrowUp } from '@proton/icons/icons/IcArrowUp';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import './TableHeaderCell.scss';

interface Props extends ThHTMLAttributes<HTMLTableCellElement> {
    children?: ReactNode;
    direction?: SORT_DIRECTION;
    isLoading?: boolean;
    onSort?: () => void;
}

const TableHeaderCell = ({ children, direction, isLoading, onSort, ...rest }: Props) => {
    const content = onSort ? (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="flex-nowrap inline-flex *:self-center cursor-pointer table-header-cell-hover" onClick={onSort}>
            <span className="mr-1">{children}</span>
            {direction && (
                <IcArrowUp
                    size={4}
                    className={`mr-1 shrink-0 ${direction === SORT_DIRECTION.ASC ? '' : 'rotateX-180'}`}
                />
            )}
            {isLoading && <Loader className="flex shrink-0" />}
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
