import { type FC } from 'react';
import { Link } from 'react-router-dom';

import clsx from '@proton/utils/clsx';

type Props = { active: boolean; label: string; first?: boolean; to?: string };

export const Breadcrumb: FC<Props> = ({ active, label, first = false, to = '#' }) => (
    <>
        {!first && <span className="mx-1">{'>'}</span>}
        <Link to={to}>
            <button className={clsx(active && 'text-semibold', 'color-norm')}> {label}</button>
        </Link>
    </>
);
