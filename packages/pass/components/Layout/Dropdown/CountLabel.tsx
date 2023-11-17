import type { VFC } from 'react';

type Props = { label: string; count: number };

export const CountLabel: VFC<Props> = ({ label, count }) => (
    <>
        <span className="block text-ellipsis">{label}</span>
        <span className="shrink-0 color-weak">({count})</span>
    </>
);
