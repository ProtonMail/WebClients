import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from 'react';

import { TableCell } from '@proton/components/components';
import Icon from '@proton/components/components/icon/Icon';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

const { ASC, DESC } = SORT_DIRECTION;

interface SortingTableCellHeaderProps {
    content: ReactNode;
    onClick: () => void;
    direction?: SORT_DIRECTION;
}

export const SortingTableCellHeader = ({ content, onClick = noop, direction }: SortingTableCellHeaderProps) => {
    return (
        <div className="flex-nowrap inline-flex *:self-center">
            <span
                tabIndex={0}
                role="button"
                className="link mr-2"
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onClick();
                    }
                }}
            >
                {content}
            </span>
            {direction === ASC || direction === DESC ? (
                <Icon name="chevron-down" className={`shrink-0 ${direction === DESC ? '' : 'rotateX-180'}`} />
            ) : null}
        </div>
    );
};

interface CellUnsortableProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'content'> {
    content: ReactNode;
    key?: undefined | null | never;
    sorting?: undefined | null | false;
}

interface CellSortableProps<T> extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'content'> {
    content: ReactNode;
    key: keyof T;
    sorting: true;
}

type CellProps<T = any> = CellUnsortableProps | CellSortableProps<T>;

interface SortingTableHeaderProps<T> extends HTMLAttributes<HTMLTableSectionElement> {
    cells: CellProps<T>[];
    config: {
        key: keyof T;
        direction: SORT_DIRECTION;
    };
    onToggleSort: (key: keyof T) => void;
}

const getCellKey = (key: symbol | string | number | null | undefined, index: number) =>
    typeof key === 'string' || typeof key === 'number' ? `key-${key}` : `index-${index}`;

export const SortingTableHeader = <T extends unknown>({
    cells = [],
    config,
    onToggleSort,
    ...rest
}: SortingTableHeaderProps<T>) => {
    return (
        <thead {...rest}>
            <tr>
                {cells.map(({ content, key, sorting, ...rest }, index) => (
                    <TableCell key={getCellKey(key, index)} type="header" {...rest}>
                        {sorting ? (
                            <SortingTableCellHeader
                                content={content}
                                onClick={() => onToggleSort(key)}
                                direction={config && config.key === key ? config.direction : undefined}
                            />
                        ) : (
                            content
                        )}
                    </TableCell>
                ))}
            </tr>
        </thead>
    );
};
