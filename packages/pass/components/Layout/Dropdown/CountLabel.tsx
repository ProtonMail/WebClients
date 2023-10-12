import type { VFC } from 'react';

type Props = { label: string; count: number };

export const CountLabel: VFC<Props> = ({ label, count }) => (
    <>
        <span className="block text-ellipsis">{label}</span>
        <span className="flex-item-noshrink color-weak">({count})</span>
    </>
);
