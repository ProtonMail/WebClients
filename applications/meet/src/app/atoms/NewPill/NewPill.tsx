import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './NewPill.scss';

interface NewPillProps {
    className?: string;
    children: React.ReactNode;
}

export const NewPill = ({ className, children }: NewPillProps) => {
    return (
        <div className="flex flex-nowrap items-center gap-1">
            <span
                className={clsx(
                    'new-pill inline-flex flex-nowrap items-center shrink-0 gap-1.5 py-1.5 rounded-full color-success text-xs meet-font-weight text-uppercase',
                    className
                )}
            >
                {c('Info').t`New`}
            </span>
            {children}
        </div>
    );
};
