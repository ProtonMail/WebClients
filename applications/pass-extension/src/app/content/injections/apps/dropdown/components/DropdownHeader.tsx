import type { ReactElement, VFC } from 'react';

type Props = { title: string; extra?: ReactElement };

export const DropdownHeader: VFC<Props> = ({ title, extra }) => (
    <div className="flex flex-nowrap flex-item-noshrink flex-align-items-center flex-justify-space-between px-4 pt-1">
        <span className="text-sm text-ellipsis">{title}</span>
        {extra}
    </div>
);
