import type { FC } from 'react';

type Props = { title: string; subtitle?: string };

export const DropdownMenuLabel: FC<Props> = ({ title, subtitle }) => (
    <div className="pl-2 lh120">
        <div>{title}</div>
        {subtitle && <span className="text-sm color-weak">{subtitle}</span>}
    </div>
);
