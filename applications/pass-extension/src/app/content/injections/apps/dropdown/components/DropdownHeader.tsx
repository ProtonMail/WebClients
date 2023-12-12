import type { ReactElement, VFC } from 'react';

type Props = { title: string; extra?: ReactElement };

export const DROPDOWN_HEADER_HEIGHT = 2; /* rem */

export const DropdownHeader: VFC<Props> = ({ title, extra }) => (
    <div
        className="flex flex-nowrap shrink-0 items-center justify-space-between h-custom pl-3 pr-2 pt-2"
        style={{ '--h-custom': `${DROPDOWN_HEADER_HEIGHT}rem` }}
    >
        <span className="text-xs text-semibold text-ellipsis">{title}</span>
        {extra}
    </div>
);
