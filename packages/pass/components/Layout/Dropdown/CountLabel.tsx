import type { VFC17 } from 'react';

type Props = { label: string; count: number };

export const CountLabel: VFC17<Props> = ({ label, count }) => (
    <>
        <span className="block text-ellipsis">{label}</span>
        <span className="shrink-0 color-weak">({count})</span>
    </>
);
