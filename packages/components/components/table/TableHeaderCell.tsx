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
        <div className="flex-nowrap inline-flex children-self-center cursor-pointer table-header-cell-hover" onClick={onSort}>
            <span className="mr-1">{children}</span>
            {direction && (
                <Icon
                    name="arrow-up"
                    size={16}
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