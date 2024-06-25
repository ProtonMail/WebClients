import { CSSProperties, ReactNode } from 'react';

import { Icon, IconName } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';

import './Datalist.scss';

interface DataListItemProps {
    label: ReactNode;
    bottomNode: ReactNode;
    leftIcon?: IconName | ReactNode;
    align?: 'start' | 'end';
}

export const DataListItem = ({ leftIcon, label, bottomNode, align = 'start' }: DataListItemProps) => {
    const { isNarrow } = useResponsiveContainerContext();
    return (
        <div className={clsx('datagrid-cell')}>
            <div className="flex flex-row flex-nowrap w-full">
                {leftIcon && typeof leftIcon === 'string' ? <Icon name={leftIcon as IconName} /> : leftIcon}
                <div className="grow">
                    <div className={clsx('flex flex-column w-full', `items-${align}`)}>
                        <div className={clsx('w-full flex', isNarrow && 'text-sm')}>{label}</div>
                        <div className={clsx('w-full flex mt-1', isNarrow && 'text-sm')}>{bottomNode}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export type DataColumn<I> = {
    colSpan: string;
    className?: string;
    style?: CSSProperties;
    id: string;
    data: (item: I) => ReturnType<typeof DataListItem>;
};

interface DataListProps<I> {
    columns: DataColumn<I>[];
    rows: I[];
    onClickRow?: (row: I) => void;
    canClickRow?: (row: I) => boolean;
}

export const DataList = <I extends { key: string }>({ columns, rows, canClickRow, onClickRow }: DataListProps<I>) => {
    const { isNarrow } = useResponsiveContainerContext();

    return (
        <div
            className="datagrid-container h-full w-full py-2"
            style={{
                gridTemplateColumns: columns.map(({ colSpan }) => colSpan).join(' '),
            }}
        >
            {rows.map((row) => {
                return (
                    <button
                        key={row.key}
                        className={clsx(
                            'datagrid-row',
                            isNarrow ? 'px-3 py-2' : 'px-6 py-3',
                            onClickRow && (!canClickRow || canClickRow(row)) && 'hoverable-row'
                        )}
                        onClick={() => onClickRow?.(row)}
                    >
                        {columns.map(({ id, data, className, style }, colIndex) => {
                            return (
                                <div
                                    key={`col-${id}-row-${row.key}`}
                                    className={clsx(className, 'overflow-hidden')}
                                    style={{ ...style, gridColumn: colIndex + 1 }}
                                >
                                    {data(row)}
                                </div>
                            );
                        })}
                    </button>
                );
            })}
        </div>
    );
};
