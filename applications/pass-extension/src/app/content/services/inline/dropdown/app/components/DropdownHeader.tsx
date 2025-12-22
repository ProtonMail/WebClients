import type { FC, ReactElement } from 'react';

type Props = { title: string; extra?: ReactElement };

export const DROPDOWN_HEADER_HEIGHT = 2; /* rem */

export const DropdownHeader: FC<Props> = ({ title, extra }) => (
    <div
        className="flex flex-nowrap shrink-0 items-center justify-space-between h-custom pl-3 pr-2 pt-2"
        style={{ '--h-custom': `${DROPDOWN_HEADER_HEIGHT}rem` }}
    >
        <span className="text-sm text-semibold text-ellipsis">{title}</span>
        {extra}
    </div>
);
