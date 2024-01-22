import type { FC } from 'react';

type Props = { label: string; count: number };

export const CountLabel: FC<Props> = ({ label, count }) => (
    <>
        <span className="block text-ellipsis">{label}</span>
        <span className="shrink-0 color-weak">({count})</span>
    </>
);
