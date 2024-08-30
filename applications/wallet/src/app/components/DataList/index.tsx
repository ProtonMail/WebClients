import type { CSSProperties, ReactNode } from 'react';

import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';

import './Datalist.scss';

interface DataListItemProps {
    label: ReactNode;
    bottomNode: ReactNode;
    leftIcon?: IconName | ReactNode;
    align?: 'start' | 'end';
    className?: string;
}

export const DataListItem = ({ leftIcon, label, bottomNode, className, align = 'start' }: DataListItemProps) => {
    const { isNarrow } = useResponsiveContainerContext();
    return (
        <div className="datagrid-cell h-full">
            <div className="flex flex-row items-center flex-nowrap w-full">
                {leftIcon && typeof leftIcon === 'string' ? <Icon name={leftIcon as IconName} /> : leftIcon}
                <div className="grow">
                    <div className={clsx('flex flex-column w-full', `items-${align}`)}>
                        <div className={clsx('w-full flex', className, isNarrow && 'text-sm')}>{label}</div>
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
            className="datagrid-container w-full"
            style={{
                gridTemplateColumns: columns.map(({ colSpan }) => colSpan).join(' '),
            }}
        >
            {rows.map((row) => {
                return (
                    <button
                        key={row.key}
                        className={clsx(
                            'datagrid-row relative',
                            isNarrow ? 'px-3 py-2' : 'px-6 py-3',
                            onClickRow && (!canClickRow || canClickRow(row)) && 'hoverable-row interactive-pseudo-inset'
                        )}
                        onClick={() => onClickRow?.(row)}
                    >
                        {columns.map(({ id, data, className, style }, colIndex) => {
                            return (
                                <div
                                    key={`col-${id}-row-${row.key}`}
                                    className={clsx(className, 'overflow-hidden h-full')}
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
