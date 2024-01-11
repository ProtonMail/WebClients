import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

import './PersistentUpsellBar.scss';

export const PersistentUpsellBar: FC = ({ children }) => {
    const passPlan = useSelector(selectPassPlan);
    if (passPlan === UserPassPlan.PLUS) return null;

    return (
        <div className="pass-bottom-bar flex items-center justify-center flex-nowrap w-full p-2 color-norm">
            <div className="flex gap-2 items-center text-center text-xs">{children}</div>
        </div>
    );
};
