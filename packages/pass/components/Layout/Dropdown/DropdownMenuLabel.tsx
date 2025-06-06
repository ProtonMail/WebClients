import type { FC, ReactNode } from 'react';

type Props = { title: ReactNode; subtitle?: ReactNode };

export const DropdownMenuLabel: FC<Props> = ({ title, subtitle }) => (
    <div className="pl-2 lh120">
        <div>{title}</div>
        {subtitle && <span className="text-sm color-weak">{subtitle}</span>}
    </div>
);
