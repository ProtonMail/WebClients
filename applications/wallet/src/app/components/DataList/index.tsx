import { CSSProperties, ReactNode } from 'react';

import { Icon, IconName } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import './Datalist.scss';

interface DataListItemProps {
    label: ReactNode;
    bottomNode: ReactNode;
    leftIcon?: IconName | ReactNode;
    align?: 'start' | 'end';
}

export const DataListItem = ({ leftIcon, label, bottomNode, align = 'start' }: DataListItemProps) => {
    return (
        <div className={clsx('w-full flex flex-row flex-nowrap')}>
            {leftIcon && typeof leftIcon === 'string' ? <Icon name={leftIcon as IconName} /> : leftIcon}
            <div className={clsx('flex flex-column grow', `items-${align}`)}>
                <div className="w-full flex">{label}</div>
                <div className="w-full flex mt-1">{bottomNode}</div>
            </div>
        </div>
    );
};

interface DataListProps<I> {
    columns: {
        className?: string;
        style?: CSSProperties;
        id: string;
        data: (item: I) => ReturnType<typeof DataListItem>;
    }[];
    rows: I[];
    onClickRow?: (row: I) => void;
    canClickRow?: (row: I) => boolean;
}

export const DataList = <I extends { key: string }>({ columns, rows, canClickRow, onClickRow }: DataListProps<I>) => {
    return (
        <div className="h-full w-full py-2">
            {rows.map((row) => {
                return (
                    <div
                        key={row.key}
                        className={clsx(
                            'flex flex-row flex-nowrap items-center w-full px-6 py-3 gap-2',
                            onClickRow && (!canClickRow || canClickRow(row)) && 'hoverable-row'
                        )}
                        onClick={() => onClickRow?.(row)}
                    >
                        {columns.map(({ id, data, className, style }) => {
                            return (
                                <div key={`col-${id}-row-${row.key}`} className={className} style={style}>
                                    {data(row)}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
