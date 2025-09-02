import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface PlanIconNameProps {
    logo: ReactNode;
    topLine: ReactNode;
    bottomLine?: ReactNode;
    className?: string;
    layout?: 'vertical' | 'horizontal';
}

const PlanIconName = ({ logo, topLine, bottomLine, layout = 'horizontal', className }: PlanIconNameProps) => {
    return (
        <div
            className={clsx(
                'flex flex-nowrap',
                layout === 'vertical' ? 'flex-column gap-2' : 'items-center gap-3',
                className
            )}
        >
            {logo}
            <div className="flex flex-column">
                <span className="text-lg text-semibold">{topLine}</span>
                {bottomLine && <span className="text-rg">{bottomLine}</span>}
            </div>
        </div>
    );
};

export default PlanIconName;
